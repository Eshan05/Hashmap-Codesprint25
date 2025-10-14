<div align="center">
	<br />
		<a href="https://" target="_blank">
			<img src="./public/images/HomeDark.png" alt="Project Banner">
		</a>
	<br />
	<div>
		<img src="https://img.shields.io/badge/-Next_JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000" alt="nextdotjs" />
		<img src="https://img.shields.io/badge/-Shadcn-green?style=for-the-badge&logoColor=white&logo=shadcn&color=gray" alt="shadcn" />
		<img src="https://img.shields.io/badge/-ReactJs-61DAFB?logo=react&logoColor=white&style=for-the-badge" alt="reactdotjs" />
		<img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
		<img src="https://img.shields.io/badge/-Typescript-purple?style=for-the-badge&logoColor=white&logo=typescript&color=blue" alt="typescript" />
		<img src="https://img.shields.io/badge/-MongoDB-green?style=for-the-badge&logoColor=white&logo=mongodb&color=47A248" alt="mongodb" />
	</div>
	<h3 align="center"> AI-Assisted Contextual Health Tools </h3>
 Symptom triage, disease briefings, medicine overviews, health calendar and calculators, movement guidance, and more.
</div>

## 🍁 Overview

PHT (Personal health tools) is an AI-augmented health companion built on Next.js. It focuses on **clear, structured medical briefings** rather than raw chat, using rich cards, gauges, and timelines to surface:

- **Symptom analyses** with potential conditions, medications, and escalation cues.
- **Disease briefings** with layperson summaries, trajectory, risk factors, and follow-up checklists.
- **Medicine insights** with indications, mechanisms, precautions, and interaction prompts.
- **Exercise / movement tracks** that respect current energy levels and recent symptoms.

The goal is not to replace clinicians but to **help patients organize questions, understand patterns, and arrive at appointments better prepared.**

### 💻 Technologies

[![React JS](https://skillicons.dev/icons?i=react "React JS")](https://react.dev/ "React JS")
[![Next JS](https://skillicons.dev/icons?i=next "Next JS")](https://nextjs.org/ "Next JS")
![Typescript](https://skillicons.dev/icons?i=ts "Typescript")
[![Mongo](https://skillicons.dev/icons?i=mongodb "Mongo")](https://www.mongodb.com/ "MongoDB")
[![Tailwind CSS](https://skillicons.dev/icons?i=tailwind "Tailwind CSS")](https://tailwindcss.com/ "Tailwind CSS")
[![Vercel](https://skillicons.dev/icons?i=vercel "Vercel")](https://vercel.com/ "Vercel")

- **Language**: TypeScript
- **Framework**: [Next.js App Router](https://nextjs.org/)
- **Backend/Data**: Next.js API routes, MongoDB with Mongoose, Redis (Upstash) for caching/ratelimiting
- **Frontend**: [`shadcn/ui`](https://ui.shadcn.com/) components, Tailwind CSS, Lucide icons
- **AI**: Google Generative AI (Gemini) with strict JSON schema responses

## 🚀 Core Features

- 🩺 **Symptom Insight Console**
	- Submit natural-language symptom descriptions.
	- Get **ranked potential conditions** with trend labels and explanations.
	- See **when to seek help** with criticality gauges and escalation copy.
	- View AI-generated **quick checklists** and at-home relief ideas.

- 🦠 **Disease Briefings**
	- Single-payload **disease report** with summary, symptoms, transmission, severity, progression, and clinical details.
	- "Trajectory & outlook" visualization with severity gauge and stage highlights.
	- **Care guidance** sections (diagnosis, medications, therapies, lifestyle, prevention).
	- Patient-friendly **primer** plus a clinician-leaning **clinical insights** block.

- 💊 **Medicine Reports**
	- Medicine detail pages with:
		- Indications, mechanism of action.
		- Common side effects, risks, and interactions.
		- Suggestions for what to ask your clinician.

- 🧭 **Recent Search Timeline**
	- Per-user **recent symptom / disease / medicine searches**.
	- Quickly jump back into a previous report without re-running the model.

- 🧘 **Movement & Exercises Dashboard**
	- Landing-style **Movement Studio** page for curated tracks.
	- Upper, lower, and yoga flows tailored to different energy levels.
	- Spotlight card for today's recommended routine.
	- Curate exercises based on user input and metrics.

> ⚠️ This project is for exploration and personal use. It is **not a medical device** and does not provide professional medical advice.

## 🤝 Usage

Once running, the main flows look like this:

1. **Sign in / create an account** via the auth pages (optional depending on your setup).
2. Go to the **Symptom Search** dashboard and submit your symptoms in natural language.
3. Review the generated **Symptom Analysis** page:
	 - Potential conditions, possible medications, and when-to-seek-help cues.
	 - AI disclaimers and input summaries accessible via drawers.
4. Jump to the **Disease** or **Medicine** dashboards for deeper briefings.
5. Use the **Exercises** dashboard to align your movement with your current energy and symptom context.

## ⚙️ Setup

```bash
# Clone the repo
git clone https://github.com/Eshan05/Hashmap-Codesprint.git
cd Hashmap-Codesprint

# Install dependencies (pnpm recommended)
pnpm install

# Copy and fill environment variables
# (look for .env.example or existing env usage in lib/ and app/api)

# Run the dev server
pnpm dev
```

Then open `http://localhost:3000` in your browser.

## 🌱 Roadmap & Future Ideas

### Near-Term

- ✨ **UI/UX parity across result pages**
	- Bring the **medicine** and **disease** result pages fully in line with the **symptom analysis console** layout (hero cards, disclaimers, gauges, and quick actions).

- 📅 **Appointments Calendar**
	- Calendar view for **appointments, follow-ups, and notes**.
	- Attach symptom logs, disease briefings, and medicine lists to a specific visit.

- 📝 **Structured Note Templates**
	- Doctor and specialty-specific templates (e.g. cardiology check-in, neuro follow-up).
	- One-click note scaffolds you can fill before or after an appointment.

- 🤖 **AI for Notes**
	- Ask questions **across all notes** or a **single note**.
	- Highlight missing questions, prep-checklists, or things to clarify with your clinician.

- 📓 **Notion-like Editor**
	- Block-based notes with headings, bullets, toggles, and embeds.
	- Per-doctor or per-condition note spaces.
	- Inline AI suggestions for follow-up tasks or questions.

- 👤 **Better Profile Dialog**
	- Richer health profile (conditions, meds, allergies, risk factors).
	- Drives more personalized **symptom / disease / medicine** responses.

- 🧬 **Condition & Medicine Knowledge Space**
	- Static, curated condition and medicine pages that are **not user-specific**, for reliable reference.

- 📎 **Export & Sharing**
	- Export symptom/disease/medicine reports as **PDFs** in a few clean layouts.
	- Share **secure links** with clinicians or caregivers.

## 📱 Screenshots

![Symptom Analysis](public/images/symptom-analysis.png)
![Disease Briefing](public/images/disease-briefing.png)
![Medicine Report](public/images/medicine-report.png)
![Movement Studio](public/images/movement-studio.png)

## 📄 Additional Notes

- This project is experimental and not intended for clinical decision-making.
- Issues, suggestions, and PRs are welcome.
