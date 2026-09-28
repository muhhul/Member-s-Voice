import { deleteVoice } from "@/app/admin/(protected)/actions";
import { ConfirmButton } from "@/components/confirm-button";

/**
 * Server Component yang membungkus ConfirmButton, jadi tidak perlu "use client"
 * di sini: hanya tombolnya yang dikirim ke browser.
 */
export function DeleteVoiceButton({ voiceId }: { voiceId: string }) {
  return (
    <form action={deleteVoice}>
      <input type="hidden" name="voiceId" value={voiceId} />
      <ConfirmButton label="Hapus suara" confirmLabel="Ya, hapus permanen" icon="trash" />
    </form>
  );
}
