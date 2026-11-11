/**
 * @naijaplay/ui
 * Design tokens and age-zone visual system specifications for NaijaPlay.
 */

import { AgeZone } from "@naijaplay/shared";

export interface AgeZoneDesignTokenSpec {
  zone: AgeZone;
  label: string;
  ageRange: string;
  minTouchTargetPx: number;
  typographyScale: string;
  uxMode: string;
  communicationPolicy: string;
}

export const AGE_ZONE_DESIGN_TOKENS: Record<AgeZone, AgeZoneDesignTokenSpec> = {
  [AgeZone.JUNIOR]: {
    zone: AgeZone.JUNIOR,
    label: "Junior Zone",
    ageRange: "Ages 6–12",
    minTouchTargetPx: 48,
    typographyScale: "18px base / Playful high-contrast iconography",
    uxMode: "Guided activity cards, audio-visual cues, parent-supervised portal",
    communicationPolicy: "Zero free-text chat; pre-moderated creative studio only",
  },
  [AgeZone.TEEN]: {
    zone: AgeZone.TEEN,
    label: "Teen Zone",
    ageRange: "Ages 13–17",
    minTouchTargetPx: 44,
    typographyScale: "16px base / Competitive leaderboard & mission density",
    uxMode: "School-vs-school leagues, coding quests, moderated interest clubs",
    communicationPolicy: "Structured club announcements; no private direct messaging",
  },
  [AgeZone.YOUTH]: {
    zone: AgeZone.YOUTH,
    label: "Youth Zone",
    ageRange: "Ages 18–24",
    minTouchTargetPx: 40,
    typographyScale: "15px base / High-density tournament & skill pathways",
    uxMode: "National tournaments, digital skill tracks, creative portfolios",
    communicationPolicy: "Moderated community clubs & tournament brackets",
  },
  [AgeZone.SENIOR]: {
    zone: AgeZone.SENIOR,
    label: "Senior Zone",
    ageRange: "Ages 25–30",
    minTouchTargetPx: 40,
    typographyScale: "15px base / Professional specialization & leadership",
    uxMode: "Advanced tournaments, professional pathways, and leadership skills",
    communicationPolicy: "Moderated community clubs & tournament brackets",
  },
};
