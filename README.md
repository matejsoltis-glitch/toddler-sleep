# Toddler Sleep Assistant

A calming sleep companion app for babies and toddlers featuring soothing multi-spectrum night lights, white noise across 3 frequencies, synthesized nature soundscapes, a sleep timer with gradual fade-out, and a pediatric schedule assistant.

---
## Version History & Changelog

### v1.0.1 (Latest)
- **Language Onboarding Layout & Safe-Area Fix**: Redesigned the language selection onboarding modal into an ergonomic 2-column responsive grid that fits 100% within the viewport without requiring users to scroll.
- **Android System Navigation Clearance**: Positioned the "Continue to Application" confirmation button safely above Android 3-button system navigation bars (Back, Home, Recents) with robust `safe-area-inset-bottom` padding, resolving tap blockage on all Android device screen sizes.
- **In-App & Store Release Synchronization**: Synchronized version v1.0.1 across the interactive in-app changelog, `package.json`, Android workflow build configurations, and Google Play Console release notes.

### v1.0
- **Refined Mobile Layout Geometry**: Halved footer height (`py-1.5`) for a minimalist bottom bar, established an exact 2mm spacing between the sleep timer module and the footer, and trimmed 2mm from the top header padding (`pt-[6mm]`) for optimal screen utilization.
- **Complete Main Menu Button Localization**: Fully localized the "Back to main menu" navigation button, tooltips, and aria-labels across Slovak, Czech, English, Polish, Hungarian, Ukrainian, and Italian.
- **Interactive In-App Changelog Modal**: Tapping the version badge (`v1.0.1`) in the footer opens an interactive, scrollable modal displaying the complete version history, release notes, and latest features.
- **Author Notice & Feedback Modal**: Tapping the author's name ("Autor: Matej Šoltis") displays a localized message for parents with direct email feedback contact (`msglitchapps@gmail.com`) and one-tap copy functionality.
- **Official v1.0 Android Release Configuration**: Synchronized version 1.0 across `package.json`, root `capacitor.config.json`, and the GitHub Actions Android build workflow (`versionName "1.0"` / `versionCode 1`).

### v0.9.96
- **Responsive Vector Color Wheel**: Fixed color wheel clipping and off-center canvas distortion on high-DPI and mobile displays by rebuilding the wheel with hardware-accelerated CSS conic-radial gradients and percentage-based marker tracking, guaranteeing flawless alignment and responsive scaling on all screen sizes.
- **Continuous Gentle Color Transitions**: Completely eliminated abrupt color jumping in Calm Light mode, Fullscreen Lamp, and ambient app background. Implemented dual cross-fading layers and mask-based continuous color interpolation so shades melt smoothly and progressively into each other without eye strain.
- **Circadian Spectrum Naming Update**: Renamed palette to "Cirkadiálne spektrum" ("Circadian Spectrum") and updated description to "Na základe výskumu spánkových laboratórií" ("Based on sleep laboratory research") across all localized languages.
- **Full 7-Language Localization**: Synchronized all updated palette titles, descriptions, and color wheel indicators across Slovak, Czech, English, Polish, Hungarian, Ukrainian, and Italian.

### v0.9.95
- **30% More Compact Sliders Window**: Streamlined the master sliders panel and individual liquid sliders by ~30% in vertical footprint, optimizing padding and track channels while preserving intuitive touch targets and animated water wave dynamics.
- **Science-Backed Circadian Sleep Spectrum Mode**: Added a new chronobiology-grounded palette based on Harvard & Salk sleep research (>620nm wavelengths in deep amber, ruby, and dusk ember with 0% melanopsin suppression to naturally stimulate nocturnal melatonin synthesis).
- **Custom Spectrum ("Ľubovoľné") with Interactive Color Wheel**: Added a custom palette mode allowing users to choose 2 to 6 arbitrary soothing colors using a coded HTML5 Canvas circular Color Wheel, touch-radial tracking, softness/lightness control, add/remove color slots, and quick baby presets.
- **Single Active Palette Display with Smooth Accordion Drawer**: The soothing color spectrum list now displays ONLY the currently active (or last active) palette. Other palettes unfold smoothly upon click using the same silky 520ms cubic-bezier accordion transition as the sleep timer drawer.
- **Full 7-Language Localization**: Fully translated all new modes, palette names, descriptions, color picker hints, and actions across Slovak, Czech, English, Polish, Hungarian, Ukrainian, and Italian.

### v0.99
- **Interactive Month Calendar Date Picker**: Fixed the "Pick date" button in sleep history by building a dedicated in-app Month Calendar Modal with month navigation, weekday headers, session indicator dots, and direct day selection for 100% reliable mobile touch interaction.
- **Sleep Timer Screen Dimming**: Added an ultra-dark minimum brightness scrim that activates when the sleep timer completes, keeping the screen dimmed until the user touches anywhere on the screen.
- **Components Opacity Slider (5% - 100%)**: Added a third liquid slider "Opacity" ("Priehľadnosť") in the Main Menu to adjust the overall transparency of UI components, letting ambient night colors softly shine through.
- **Compact & Intuitive Sliders**: Redesigned all main menu sliders to be more compact, ergonomic, and responsive with real-time percentage readouts.
- **Comprehensive 7-Language Localization**: Fully translated all new features, calendar headers, days, months, and opacity labels across Slovak, Czech, English, Polish, Hungarian, Ukrainian, and Italian.

### v0.98
- **Timer Interface Streamlining**: Removed the subtitle description under the timer title for a cleaner, minimalist card layout.
- **Removed Secondary Timer Label**: Removed the small gray remaining time indicator above the liquid progress slider.

### v0.97
- **High-Precision Timer Scrubber**: Increased slider touch sensitivity from 5-minute stepping to 10-second increments for fine-tuned time adjustments.
- **Redesigned Timer Card Header**: Restructured header layout to eliminate text clipping and truncation on mobile screens, providing a clean visual hierarchy for title, countdown, and quick controls.

### v0.96
- **Sleep Timer 5-Minute Stepping**: Changed time addition and reduction buttons from 15-minute to 5-minute increments (`-5m` and `+5m`).
- **Liquid Water Timer Scrubber**: Upgraded the sleep timer progress bar into an interactive liquid water ripple effect matching the main menu sliders, without circular handle balls.
- **Removed Slider Control Balls**: Removed circular handle balls (thumbs) from both main menu sliders (Volume and Brightness) for a unified, modern liquid water aesthetic.
- **Cleaned Timer Interface**: Removed redundant helper text, hand icon, and bottom time display under the timer scrubber.
- **Simplified Schedule Day Filter**: Removed "Today" and "Yesterday" buttons from the schedule history toolbar, keeping "All Days" and native calendar date picking.

### v0.95
- **History Display Pagination**: Limited default sleep session history to 6 entries with an expandable toggle to display up to 10 entries and finger-scrollable older records.
- **Interactive Calendar Navigation**: Added calendar day toolbar to filter sleep sessions by specific date, including day-by-day stepper (`◀` / `▶`) and date picker.
- **Draggable Sleep Timer Scrubber**: Converted sleep timer progress indicator into a touch-draggable scrubber for direct time adjustments.
- **Timer Decrement Button**: Added time reduction button alongside extend button.
- **Export to Drafts**: Preserved Google Drive CSV export logic in internal drafts and hid it from the active UI until ready.

### v0.92
- **Full Multi-Language Localization**: Added comprehensive 7-language localization (Slovak, Czech, English, Polish, Hungarian, Ukrainian, Italian) across Mode 4 (Schedule Assistant), live states, modals, and CSV headers.
- **Eye-Saving Mode Fix**: Prevented night/eye-saving mode from activating automatically during language switching by storing explicit user preference in persistent storage.

### v0.91
- **Android APK File Export**: Integrated Capacitor Filesystem and Share plugins for native CSV export and sharing on Android devices.

### v0.90
- **Header Safe-Area Adjustment**: Lowered the top header by approximately 8mm to ensure comfortable safe-area clearance on mobile displays.
- **Relocated Header Timer**: Moved the active countdown badge below the day/night status label to avoid camera cutouts and notches.
- **Collapsible Schedule Assistant**: Truncated the schedule assistant top card to a description preview with an expandable arrow toggle.
- **Unified Statistics Card**: Added a dedicated statistics window showing today's total sleep time, nap count, and day/night breakdown.

### v0.87
- **Audio Synthesis Refinements**: Softened the "gentle rain" nature soundscape for enhanced realism; halved cricket chirping volume in the "night forest birds" soundscape.
- **White Noise Label Cleanup**: Removed the "v loope" (looping) subtitle from white noise mode cards.
