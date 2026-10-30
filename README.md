# Toddler Sleep Assistant

A sanity-saving Android app engineered by a tired parent and compiled into an APK using GitHub Actions and pure determination.

Zero ads. Zero subscriptions. Zero pop-ups asking for ratings while you are negotiating bedtime with a tiny human who suddenly remembered they are thirsty.

---

## The Mission

Toddlers are tiny, unpredictable forces of nature. When bedtime arrives, logic leaves the room.  
Toddler Sleep Assistant is built to create an immersive, distraction-free sensory routine to guide your toddler toward sleep and restore quiet evening hours for parents.

---

## Features

* **Calming Light:** A cycling, soft-glow display that replaces harsh ceiling lights.
* **White Noise:** Three looping intensity levels to mask household background sounds and footsteps.
* **Nature Sounds:** Rain, forest ambience, gentle waves, and nighttime birds for a relaxing nursery atmosphere.
* **Sleep Tracker and Routine:** Monitor wake windows, bedtime schedules, and sleep patterns.
* **Auto Sleep Timer:** Shuts off playback automatically, including an instant plus 15-minute extension option.
* **Ad-Free Experience:** No commercial interruptions or third-party tracking.
* **Edge-to-Edge Fullscreen:** System bar, clock, and battery icons remain hidden to prevent accidental touches or exits.

---

## Technical Overview

* **Frontend:** React, Vite, and Tailwind CSS
* **Mobile Runtime:** Capacitor
* **CI/CD Pipeline:** Automated Android APK generation via GitHub Actions
* **Requirements:** Built directly in the cloud without local SDK configuration

---

## How It Works

With every code update in this repository:
1. GitHub Actions initiates an automated Ubuntu runner.
2. The web application builds and packages into a native Android Capacitor environment.
3. Immersive fullscreen flags are applied directly to Android system settings.
4. A production-ready debug APK is generated and made available under the GitHub Actions Artifacts tab.

---

## Author

Created by Matej Šoltis. matej.soltis@gmail.com
