import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { listFornecedores, upsertFornecedor, deleteFornecedor } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/fornecedores")({
  component: Page,
});

function Page() {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const list = useServerFn(listFornecedores);
  const save = useServerFn(upsertFornecedor);
  const del = useServerFn(deleteFornecedor);

  const load = () => list().then(setRows).catch((e) => toast.error(e.message));
  useEffect(load, []);

  const onSave = async (form: any) => {
    try { await save({ data: form }); toast.success("Fornecedor salvo"); setEditing(null); load(); }
    catch (e: any) { toast.error(e.message); }
  };
  const onDelete = async (id: string) => {
    if (!confirm("Excluir fornecedor?")) return;
    try { await del({ data: { id } }); toast.success("Excluído"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">Cadastro</p>
          <h1 className="font-serif text-3xl mt-1">Fornecedores</h1>
        </div>
        <button onClick={() => setEditing({})} className="bg-foreground text-background px-4 py-2 text-xs tracking-[0.2em] uppercase flex items-center gap-2">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </header>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-secondary/40">
            <tr><th className="p-3">Razão social</th><th>CNPJ</th><th>E-mail</th><th>Telefone</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">{r.razao_social}</td>
                <td className="text-muted-foreground">{r.cnpj ?? "—"}</td>
                <td>{r.email ?? "—"}</td>
                <td>{r.telefone ?? "—"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => setEditing(r)} className="p-2 hover:bg-secondary rounded"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(r.id)} className="p-2 hover:bg-secondary rounded"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum fornecedor.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && <FornForm data={editing} onSave={onSave} onCancel={() => setEditing(null)} />}
    </div>
  );
}

function FornForm({ data, onSave, onCancel }: any) {
  const [f, setF] = useState<any>({
    id: data.id,
    razao_social: data.razao_social ?? "",
    cnpj: data.cnpj ?? "",
    email: data.email ?? "",
    telefone: data.telefone ?? "",
    endereco: data.endereco ?? "",
  });
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-background max-w-xl w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-2xl mb-4">{data.id ? "Editar" : "Novo"} fornecedor</h2>
        <div className="space-y-3 text-sm">
          <label className="block">Razão social<input value={f.razao_social} onChange={(e) => setF({ ...f, razao_social: e.target.value })} className="w-full border border-border p-2 mt-1" /></label>
          <label className="block">CNPJ<input value={f.cnpj} onChange={(e) => setF({ ...f, cnpj: e.target.value })} className="w-full border border-border p-2 mt-1" /></label>
          <label className="block">E-mail<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="w-full border border-border p-2 mt-1" /></label>
          <label className="block">Telefone<input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} className="w-full border border-border p-2 mt-1" /></label>
          <label className="block">Endereço<textarea value={f.endereco} onChange={(e) => setF({ ...f, endereco: e.target.value })} className="w-full border border-border p-2 mt-1" rows={2} /></label>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="px-4 py-2 border border-border text-xs uppercase tracking-[0.2em]">Cancelar</button>
          <button onClick={() => onSave(f)} className="px-4 py-2 bg-foreground text-background text-xs uppercase tracking-[0.2em]">Salvar</button>
        </div>
      </div>
    </div>
  );
}
