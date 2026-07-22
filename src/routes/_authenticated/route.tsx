import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data: { session }, error: sessErr } = await supabase.auth.getSession();
    if (sessErr || !session) {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw redirect({ to: "/login" });
      return { user: data.user };
    }
    return { user: session.user };
  },
  component: () => <Outlet />,
});
