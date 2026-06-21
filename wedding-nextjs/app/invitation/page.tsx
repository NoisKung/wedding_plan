import { HeroSection } from "@/components/invitation/HeroSection";
import { InvitationSection } from "@/components/invitation/InvitationSection";
import { CountdownSection } from "@/components/invitation/CountdownSection";
import { ScheduleSection } from "@/components/invitation/ScheduleSection";
import { GallerySection } from "@/components/invitation/GallerySection";
import { VenueSection } from "@/components/invitation/VenueSection";
import { RSVPSection } from "@/components/invitation/RSVPSection";

export default function InvitationPage() {
  return (
    <main>
      <HeroSection />
      <InvitationSection />
      <CountdownSection />
      <ScheduleSection />
      <GallerySection />
      <VenueSection />
      <RSVPSection />
    </main>
  );
}
