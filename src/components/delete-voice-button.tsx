import { deleteVoice } from "@/app/admin/(protected)/actions";
import { ConfirmButton } from "@/components/confirm-button";

/**
 * A Server Component wrapping a client ConfirmButton, so no "use client"
 * is needed here: only the button itself ships to the browser.
 */
export function DeleteVoiceButton({ voiceId }: { voiceId: string }) {
  return (
    <form action={deleteVoice}>
      <input type="hidden" name="voiceId" value={voiceId} />
      <ConfirmButton label="Hapus" confirmLabel="Ya, hapus permanen" />
    </form>
  );
}
