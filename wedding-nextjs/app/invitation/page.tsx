import { HeroSection } from "@/components/invitation/HeroSection";
import { InvitationSection } from "@/components/invitation/InvitationSection";
import { CountdownSection } from "@/components/invitation/CountdownSection";
import { ScheduleSection } from "@/components/invitation/ScheduleSection";
import { GallerySection } from "@/components/invitation/GallerySection";

export default function InvitationPage() {
  return (
    <main>
      <HeroSection />
      <InvitationSection />
      <CountdownSection />
      <ScheduleSection />
      <GallerySection />
    </main>
  );
}
