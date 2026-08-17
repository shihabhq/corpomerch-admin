"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Info, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { grantAdmin, setAdminActive } from "@/app/actions/content";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  Field,
  Input,
  Switch,
} from "@/components/ui";

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string | null;
  role: "ADMIN" | "EDITOR";
  isActive: boolean;
  createdAt: string;
}

export function UsersManager({
  users,
  currentUserId,
  supabaseProjectUrl,
}: {
  users: AdminUserRow[];
  currentUserId: string;
  supabaseProjectUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    userId: "",
    email: "",
    fullName: "",
    role: "ADMIN" as "ADMIN" | "EDITOR",
  });

  const projectRef = supabaseProjectUrl
    .replace("https://", "")
    .replace(".supabase.co", "");

  function submit() {
    startTransition(async () => {
      const result = await grantAdmin(draft);
      if (result.ok) {
        toast.success("Access granted");
        setOpen(false);
        setDraft({ userId: "", email: "", fullName: "", role: "ADMIN" });
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Card className="mb-6">
        <p className="flex items-start gap-2.5 p-4 text-xs leading-relaxed text-info">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Creating the Supabase Auth account itself needs the service-role
            key, which deliberately does not exist in this app. So the flow is
            two steps: invite the person in the Supabase dashboard, then paste
            their user id here to grant admin access.
            {projectRef ? (
              <>
                {" "}
                <a
                  href={`https://supabase.com/dashboard/project/${projectRef}/auth/users`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium underline"
                >
                  Open Supabase Auth
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              </>
            ) : null}
          </span>
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-ink">Administrators</h2>
            <p className="text-xs text-muted">
              {users.filter((u) => u.isActive).length} active of {users.length}
            </p>
          </div>
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            <UserPlus className="size-3.5" aria-hidden />
            Grant access
          </Button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface text-left">
              {["Person", "Role", "Added", "Active"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-surface">
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-ink">
                    {user.fullName ?? user.email}
                    {user.id === currentUserId ? (
                      <span className="ml-2 text-xs font-normal text-faint">you</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted">{user.email}</p>
                </td>
                <td className="px-5 py-3">
                  <Badge tone={user.role === "ADMIN" ? "brand" : "muted"}>
                    {user.role.toLowerCase()}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-xs text-faint">
                  {new Date(user.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-3">
                  <Switch
                    checked={user.isActive}
                    disabled={pending || user.id === currentUserId}
                    onCheckedChange={(checked) =>
                      startTransition(async () => {
                        const result = await setAdminActive(user.id, checked);
                        if (result.ok) {
                          toast.success(checked ? "Reactivated" : "Deactivated");
                          router.refresh();
                        } else toast.error(result.error);
                      })
                    }
                    aria-label={`Toggle access for ${user.email}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title="Grant admin access"
            description="The person must already exist as a Supabase Auth user."
          />

          <div className="space-y-4">
            <Field
              label="Supabase user id"
              htmlFor="userId"
              required
              hint="The UUID from Supabase → Authentication → Users."
            >
              <Input
                id="userId"
                value={draft.userId}
                onChange={(e) => setDraft((d) => ({ ...d, userId: e.target.value }))}
                placeholder="00000000-0000-0000-0000-000000000000"
                className="font-mono text-xs"
              />
            </Field>

            <Field label="Email" htmlFor="userEmail" required>
              <Input
                id="userEmail"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              />
            </Field>

            <Field label="Full name" htmlFor="userName">
              <Input
                id="userName"
                value={draft.fullName}
                onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
              />
            </Field>

            <Field label="Role" htmlFor="userRole">
              <select
                id="userRole"
                value={draft.role}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    role: e.target.value as "ADMIN" | "EDITOR",
                  }))
                }
                className="h-9 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand/40"
              >
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
              </select>
            </Field>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Grant access
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
