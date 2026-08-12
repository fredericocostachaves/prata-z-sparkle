import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, Pencil, Trash2, Plus, CloudUpload, Download, RefreshCw } from "lucide-react";
import { listProdutos, upsertProduto, deleteProduto, listFornecedores, syncProdutoBling, countBlingProducts, importBlingBatch, updateStockBlingBatch, syncProdutoEstoqueBling, countProdutosCadastrados } from "@/lib/admin.functions";
import { formatPrice } from "@/data/products";

export const Route = createFileRoute("/_authenticated/admin/produtos")({
  component: ProdutosPage,
});

type Produto = any;

type SyncProgress = {
  phase: "idle" | "counting" | "importing" | "done" | "error";
  action: "import" | "stock";
  current: number;
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  error?: string;
};

const ACTION_LABELS = {
  import: { counting: "Buscando produtos no Bling...", importing: "Importando produtos...", done: "Importação concluída" },
  stock: { counting: "Consultando estoque no Bling...", importing: "Atualizando estoque...", done: "Estoque atualizado" },
};

function SyncOverlay({ progress }: { progress: SyncProgress }) {
  if (progress.phase === "idle" || progress.phase === "done") return null;

  const labels = ACTION_LABELS[progress.action];
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  const importedLabel = progress.action === "stock" ? "atualizados" : "importados";
  const skippedLabel = progress.action === "stock" ? "sem correspondência" : "já existentes";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-background border border-border p-8 max-w-md w-full mx-4 text-center space-y-6">
        <div className="space-y-2">
          {progress.phase === "counting" && (
            <>
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted border-t-foreground mx-auto" />
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{labels.counting}</p>
            </>
          )}
          {progress.phase === "importing" && (
            <>
              <div className="text-4xl font-serif">{pct}%</div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{labels.importing}</p>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-foreground h-2 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {progress.current} / {progress.total} processados
              </p>
              <div className="flex justify-center gap-4 text-xs">
                {progress.imported > 0 && <span className="text-green-600">{progress.imported} {importedLabel}</span>}
                {progress.skipped > 0 && <span className="text-muted-foreground">{progress.skipped} {skippedLabel}</span>}
                {progress.errors > 0 && <span className="text-red-600">{progress.errors} erros</span>}
              </div>
            </>
          )}
          {progress.phase === "error" && (
            <>
              <div className="text-red-600 text-xl">✕</div>
              <p className="text-sm text-red-600">{progress.error || "Erro na operação"}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProdutosPage() {
  const [rows, setRows] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [stockSyncingId, setStockSyncingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<SyncProgress>({
    phase: "idle",
    action: "import",
    current: 0,
    total: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
  });
  const list = useServerFn(listProdutos);
  const listF = useServerFn(listFornecedores);
  const save = useServerFn(upsertProduto);
  const del = useServerFn(deleteProduto);
  const syncBling = useServerFn(syncProdutoBling);
  const syncEstoqueBling = useServerFn(syncProdutoEstoqueBling);
  const getCount = useServerFn(countBlingProducts);
  const importBatch = useServerFn(importBlingBatch);
  const getCadastrados = useServerFn(countProdutosCadastrados);
  const updateStockBatch = useServerFn(updateStockBlingBatch);

  const load = useCallback(() => {
    list().then(setRows).catch((e) => toast.error(e.message));
    listF().then(setFornecedores).catch(() => {});
  }, [list, listF]);

  useEffect(() => { load(); }, [load]);

  const onSave = async (form: any) => {
    try {
      await save({ data: form });
      toast.success("Produto salvo");
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Excluir produto?")) return;
    try { await del({ data: { id } }); toast.success("Excluído"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const onSyncBling = async (produto: Produto) => {
    setSyncingId(produto.id);
    try {
      const result = await syncBling({ data: { produto_id: produto.id } });
      toast.success(`Produto ${result.action} no Bling`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSyncingId(null);
    }
  };

  const onSyncEstoque = async (produto: Produto) => {
    setStockSyncingId(produto.id);
    try {
      const result = await syncEstoqueBling({ data: { produto_id: produto.id } });
      toast.success(`Estoque de ${produto.sku} atualizado: ${result.estoque} un.`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setStockSyncingId(null);
    }
  };

  const onImportBling = async () => {
    setProgress({ phase: "counting", action: "import", current: 0, total: 0, imported: 0, skipped: 0, errors: 0 });

    try {
      const { total } = await getCount({ data: undefined });

      if (total === 0) {
        toast.info("Nenhum produto encontrado no Bling");
        setProgress({ phase: "idle", action: "import", current: 0, total: 0, imported: 0, skipped: 0, errors: 0 });
        return;
      }

      setProgress({ phase: "importing", action: "import", current: 0, total, imported: 0, skipped: 0, errors: 0 });

      const batchSize = 50;
      const pages = Math.ceil(total / batchSize);
      let imported = 0;
      let skipped = 0;
      let errors = 0;

      for (let page = 1; page <= pages; page++) {
        const result = await importBatch({ data: { page, limit: batchSize } });
        imported += result.imported;
        skipped += result.skipped;
        errors += result.errors;

        setProgress({
          phase: "importing",
          action: "import",
          current: Math.min(page * batchSize, total),
          total,
          imported,
          skipped,
          errors,
        });
      }

      setProgress({ phase: "done", action: "import", current: total, total, imported, skipped, errors });

      if (imported > 0) toast.success(`${imported} produto(s) importado(s) do Bling`);
      if (skipped > 0) toast.info(`${skipped} produto(s) já existente(s)`);
      if (errors > 0) toast.error(`${errors} erro(s) na importação`);
      if (imported === 0 && skipped === 0 && errors === 0) toast.info("Nenhum produto novo encontrado");

      load();
    } catch (e: any) {
      setProgress({ phase: "error", action: "import", current: 0, total: 0, imported: 0, skipped: 0, errors: 0, error: e.message });
      toast.error(e.message);
      setTimeout(() => setProgress((p) => p.phase === "error" ? { ...p, phase: "idle" } : p), 3000);
    }
  };

  const onUpdateStockBling = async () => {
    setProgress({ phase: "counting", action: "stock", current: 0, total: 0, imported: 0, skipped: 0, errors: 0 });

    try {
      const { total } = await getCadastrados({ data: undefined });

      if (total === 0) {
        toast.info("Nenhum produto cadastrado no sistema");
        setProgress({ phase: "idle", action: "stock", current: 0, total: 0, imported: 0, skipped: 0, errors: 0 });
        return;
      }

      setProgress({ phase: "importing", action: "stock", current: 0, total, imported: 0, skipped: 0, errors: 0 });

      const batchSize = 50;
      const pages = Math.ceil(total / batchSize);
      let updated = 0;
      let notFound = 0;
      let errors = 0;

      for (let page = 1; page <= pages; page++) {
        const result = await updateStockBatch({ data: { page, limit: batchSize } });
        updated += result.updated;
        notFound += result.notFound;
        errors += result.errors;

        setProgress({
          phase: "importing",
          action: "stock",
          current: Math.min(page * batchSize, total),
          total,
          imported: updated,
          skipped: notFound,
          errors,
        });
      }

      setProgress({ phase: "done", action: "stock", current: total, total, imported: updated, skipped: notFound, errors });

      if (updated > 0) toast.success(`Estoque atualizado de ${updated} produto(s)`);
      if (notFound > 0) toast.info(`${notFound} produto(s) sem correspondência no Bling`);
      if (errors > 0) toast.error(`${errors} erro(s) na atualização`);

      load();
    } catch (e: any) {
      setProgress({ phase: "error", action: "stock", current: 0, total: 0, imported: 0, skipped: 0, errors: 0, error: e.message });
      toast.error(e.message);
      setTimeout(() => setProgress((p) => p.phase === "error" ? { ...p, phase: "idle" } : p), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <SyncOverlay progress={progress} />

      <header className="flex items-center justify-between">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">Estoque</p>
          <h1 className="font-serif text-3xl mt-1">Produtos</h1>
        </div>
        <button onClick={onImportBling} disabled={progress.phase !== "idle" && progress.phase !== "done"} className="border border-border px-4 py-2 text-xs tracking-[0.2em] uppercase flex items-center gap-2 disabled:opacity-50">
          <Download className="h-4 w-4" /> Importar do Bling
        </button>
        <button onClick={onUpdateStockBling} disabled={progress.phase !== "idle" && progress.phase !== "done"} className="border border-border px-4 py-2 text-xs tracking-[0.2em] uppercase flex items-center gap-2 disabled:opacity-50">
          <RefreshCw className="h-4 w-4" /> Atualizar Estoque
        </button>
        <button onClick={() => setEditing({})} className="bg-foreground text-background px-4 py-2 text-xs tracking-[0.2em] uppercase flex items-center gap-2">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </header>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-secondary/40">
            <tr>
              <th className="p-3">SKU</th><th>Nome</th><th>Preço</th><th>Estoque</th><th>Fornecedor</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const baixo = p.estoque_atual <= p.estoque_minimo;
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">{p.sku}</td>
                  <td>{p.nome}</td>
                  <td>{formatPrice(Number(p.preco_venda))}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${baixo ? "bg-red-100 text-red-700" : ""}`}>
                      {baixo && <AlertTriangle className="h-3 w-3" />}
                      {p.estoque_atual} {baixo && "(baixo)"}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{p.fornecedores?.razao_social ?? "—"}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onSyncEstoque(p)}
                      disabled={stockSyncingId === p.id}
                      title="Sincronizar estoque com Bling"
                      className="p-2 hover:bg-secondary rounded disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${stockSyncingId === p.id ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      onClick={() => onSyncBling(p)}
                      disabled={syncingId === p.id}
                      title="Enviar para Bling"
                      className="p-2 hover:bg-secondary rounded disabled:opacity-50"
                    >
                      <CloudUpload className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditing(p)} className="p-2 hover:bg-secondary rounded"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => onDelete(p.id)} className="p-2 hover:bg-secondary rounded"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum produto cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProdutoForm produto={editing} fornecedores={fornecedores} onSave={onSave} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}

function ProdutoForm({ produto, fornecedores, onSave, onCancel }: any) {
  const [f, setF] = useState<any>({
    id: produto.id,
    sku: produto.sku ?? "",
    nome: produto.nome ?? "",
    descricao: produto.descricao ?? "",
    preco_custo: Number(produto.preco_custo ?? 0),
    preco_venda: Number(produto.preco_venda ?? 0),
    estoque_atual: produto.estoque_atual ?? 0,
    estoque_minimo: produto.estoque_minimo ?? 0,
    fornecedor_id: produto.fornecedor_id ?? null,
    peso_g: produto.peso_g ?? null,
    altura_cm: produto.altura_cm ?? null,
    largura_cm: produto.largura_cm ?? null,
    comprimento_cm: produto.comprimento_cm ?? null,
    imagem_url: produto.imagem_url ?? "",
    galeria_urls: produto.galeria_urls ?? [],
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-background max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-2xl mb-4">{produto.id ? "Editar" : "Novo"} produto</h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <label>SKU<input value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} className="w-full border border-border p-2 mt-1" /></label>
          <label>Nome<input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className="w-full border border-border p-2 mt-1" /></label>
          <label className="sm:col-span-2">Descrição<textarea value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} className="w-full border border-border p-2 mt-1" rows={2} /></label>
          <label>Preço de custo<input type="number" step="0.01" value={f.preco_custo} onChange={(e) => setF({ ...f, preco_custo: Number(e.target.value) })} className="w-full border border-border p-2 mt-1" /></label>
          <label>Preço de venda<input type="number" step="0.01" value={f.preco_venda} onChange={(e) => setF({ ...f, preco_venda: Number(e.target.value) })} className="w-full border border-border p-2 mt-1" /></label>
          <label>Estoque atual<input type="number" value={f.estoque_atual} onChange={(e) => setF({ ...f, estoque_atual: Number(e.target.value) })} className="w-full border border-border p-2 mt-1" /></label>
          <label>Estoque mínimo<input type="number" value={f.estoque_minimo} onChange={(e) => setF({ ...f, estoque_minimo: Number(e.target.value) })} className="w-full border border-border p-2 mt-1" /></label>
          <label className="sm:col-span-2">Fornecedor
            <select value={f.fornecedor_id ?? ""} onChange={(e) => setF({ ...f, fornecedor_id: e.target.value || null })} className="w-full border border-border p-2 mt-1 bg-background">
              <option value="">—</option>
              {fornecedores.map((fo: any) => <option key={fo.id} value={fo.id}>{fo.razao_social}</option>)}
            </select>
          </label>
          <label>Peso (g)<input type="number" value={f.peso_g ?? ""} onChange={(e) => setF({ ...f, peso_g: e.target.value ? Number(e.target.value) : null })} className="w-full border border-border p-2 mt-1" /></label>
          <label>Altura (cm)<input type="number" value={f.altura_cm ?? ""} onChange={(e) => setF({ ...f, altura_cm: e.target.value ? Number(e.target.value) : null })} className="w-full border border-border p-2 mt-1" /></label>
          <label>Largura (cm)<input type="number" value={f.largura_cm ?? ""} onChange={(e) => setF({ ...f, largura_cm: e.target.value ? Number(e.target.value) : null })} className="w-full border border-border p-2 mt-1" /></label>
          <label>Comprimento (cm)<input type="number" value={f.comprimento_cm ?? ""} onChange={(e) => setF({ ...f, comprimento_cm: e.target.value ? Number(e.target.value) : null })} className="w-full border border-border p-2 mt-1" /></label>
          <label className="sm:col-span-2">URL da Imagem de Capa<input value={f.imagem_url} onChange={(e) => setF({ ...f, imagem_url: e.target.value })} placeholder="https://..." className="w-full border border-border p-2 mt-1" /></label>
          <label className="sm:col-span-2">URLs da Galeria (uma por linha)<textarea value={(f.galeria_urls || []).join("\n")} onChange={(e) => setF({ ...f, galeria_urls: e.target.value.split("\n").filter(u => u.trim()) })} placeholder="https://url1.jpg&#10;https://url2.jpg" className="w-full border border-border p-2 mt-1" rows={2} /></label>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="px-4 py-2 border border-border text-xs uppercase tracking-[0.2em]">Cancelar</button>
          <button onClick={() => onSave(f)} className="px-4 py-2 bg-foreground text-background text-xs uppercase tracking-[0.2em]">Salvar</button>
        </div>
      </div>
    </div>
  );
}
