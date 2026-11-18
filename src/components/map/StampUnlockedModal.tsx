"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Dialect, EarnedStamp } from "@/types/domain";

export interface StampUnlockedModalProps {
  open: boolean;
  onClose: () => void;
  stamp: EarnedStamp | null;
  dialect?: Dialect;
}

export function StampUnlockedModal({
  open,
  onClose,
  stamp,
  dialect,
}: StampUnlockedModalProps) {
  if (!stamp) {
    return null;
  }

  const accuracyPct = Math.round(stamp.accuracy * 100);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cultural Dialect Stamp Earned"
      description={
        dialect
          ? `${dialect.name} (${dialect.region})`
          : `Scenario ${stamp.scenarioId}`
      }
      footer={
        <Button variant="gold" onClick={onClose}>
          Continue
        </Button>
      }
    >
      <div className="flex flex-col items-center space-y-4 py-2 text-center">
        {dialect ? (
          <div className="rounded-2xl border-2 border-gold-600 bg-gold-100/70 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dialect.stampArt}
              alt={`${dialect.name} stamp`}
              className="size-28 object-contain"
            />
          </div>
        ) : null}

        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-secondary">
            Accuracy: {accuracyPct}%
          </p>
          <p className="text-sm text-text-secondary">
            {stamp.earnedOffline
              ? "Earned offline on your device via Gemini Nano and saved to sync automatically."
              : "Recorded in your Cultural Map passport."}
          </p>
        </div>
      </div>
    </Modal>
  );
}
