"use client";

import { useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { upgradeWithGoogle } from "@/lib/firebase/auth";
import { Button } from "./Button";
import { Modal } from "./Modal";

export interface SignInUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (displayName: string | null) => void;
}

export function SignInUpgradeModal({
  open,
  onClose,
  onSuccess,
}: SignInUpgradeModalProps) {
  const online = useOnlineStatus();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const upgradedUser = await upgradeWithGoogle();
      onSuccess?.(upgradedUser.displayName);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Google sign-in could not be completed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sync Your Progress Across Devices"
      description="Upgrade your guest passport with Google while keeping your earned stamps, tonal mastery, and UID."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Not now
          </Button>
          <Button
            variant="primary"
            loading={loading}
            offlineDimmed={!online}
            onClick={() => void handleGoogleSignIn()}
          >
            Continue with Google
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-text-secondary">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Links your current anonymous account via{" "}
            <code className="font-mono text-xs">linkWithPopup</code> so zero
            progress is lost.
          </li>
          <li>
            Backs up your Cultural Dialect Stamps and H/M/L tonal accuracy to
            Cloud Firestore.
          </li>
          <li>
            Required if you apply to become a verified Native Speaker Trainer.
          </li>
        </ul>
        {error ? (
          <p role="alert" className="text-xs font-medium text-danger-600">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
