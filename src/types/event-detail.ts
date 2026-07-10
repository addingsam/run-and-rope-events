import type { FlyerLightboxEvent } from "@/types/flyer-lightbox";

export interface EventDetailView extends FlyerLightboxEvent {
  additionalOfferings: string[];
  description: string | null;
}
