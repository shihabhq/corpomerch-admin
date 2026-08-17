"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { saveSiteSettings } from "@/app/actions/content";
import {
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Label,
  Switch,
  Textarea,
} from "@/components/ui";

type Values = Record<string, string | boolean>;

export function SettingsForm({ defaults }: { defaults: Values }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Values>(defaults);

  const set = (key: string) => (value: string | boolean) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveSiteSettings(values);
      if (result.ok) {
        toast.success("Settings saved");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const text = (key: string) => String(values[key] ?? "");

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader
          title="Contact"
          description="Used across the storefront footer, contact page and LocalBusiness structured data."
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field
            label="WhatsApp number"
            htmlFor="whatsappNumber"
            required
            hint="Digits only, with country code — e.g. 8801612170202. Every inquiry on the site goes here."
            className="sm:col-span-2"
          >
            <div className="relative">
              <MessageCircle
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#25D366]"
                aria-hidden
              />
              <Input
                id="whatsappNumber"
                value={text("whatsappNumber")}
                onChange={(e) => set("whatsappNumber")(e.target.value)}
                className="pl-9 font-mono"
              />
            </div>
          </Field>

          <Field label="Display phone" htmlFor="contactPhone">
            <Input
              id="contactPhone"
              value={text("contactPhone")}
              onChange={(e) => set("contactPhone")(e.target.value)}
            />
          </Field>

          <Field label="Email" htmlFor="contactEmail">
            <Input
              id="contactEmail"
              type="email"
              value={text("contactEmail")}
              onChange={(e) => set("contactEmail")(e.target.value)}
            />
          </Field>

          <Field label="Address line" htmlFor="addressLine" className="sm:col-span-2">
            <Input
              id="addressLine"
              value={text("addressLine")}
              onChange={(e) => set("addressLine")(e.target.value)}
            />
          </Field>

          <Field label="City, postcode, country" htmlFor="addressCity">
            <Input
              id="addressCity"
              value={text("addressCity")}
              onChange={(e) => set("addressCity")(e.target.value)}
            />
          </Field>

          <Field label="Google Maps link" htmlFor="mapUrl">
            <Input
              id="mapUrl"
              value={text("mapUrl")}
              onChange={(e) => set("mapUrl")(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Social links" description="Blank links are hidden." />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          {(
            [
              ["facebookUrl", "Facebook"],
              ["instagramUrl", "Instagram"],
              ["linkedinUrl", "LinkedIn"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label} htmlFor={key}>
              <Input
                id={key}
                placeholder="https://"
                value={text(key)}
                onChange={(e) => set(key)(e.target.value)}
              />
            </Field>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Announcement bar"
          description="The thin black strip above the storefront header."
        />
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
            <Label htmlFor="announcementActive">Show the announcement bar</Label>
            <Switch
              id="announcementActive"
              checked={Boolean(values.announcementActive)}
              onCheckedChange={set("announcementActive")}
            />
          </div>
          <Field label="Message" htmlFor="announcementText">
            <Input
              id="announcementText"
              value={text("announcementText")}
              onChange={(e) => set("announcementText")(e.target.value)}
              placeholder="Bulk pricing on every product — send your quantity on WhatsApp."
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Default SEO"
          description="Fallback title and description for pages that do not set their own."
        />
        <div className="space-y-4 p-5">
          <Field label="Default title" htmlFor="defaultSeoTitle">
            <Input
              id="defaultSeoTitle"
              value={text("defaultSeoTitle")}
              onChange={(e) => set("defaultSeoTitle")(e.target.value)}
            />
          </Field>
          <Field
            label="Default description"
            htmlFor="defaultSeoDescription"
            hint={`${text("defaultSeoDescription").length} characters — aim for 150-160.`}
          >
            <Textarea
              id="defaultSeoDescription"
              rows={3}
              value={text("defaultSeoDescription")}
              onChange={(e) => set("defaultSeoDescription")(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Save settings
        </Button>
      </div>
    </form>
  );
}
