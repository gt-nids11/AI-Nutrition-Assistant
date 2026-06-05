# NutriMate AI – Personal Nutrition & Kitchen Copilot

NutriMate AI is a personalized food recommendation and nutrition tracking platform that acts as an intelligent kitchen assistant. The system helps users decide what to eat based on health goals, available pantry stock, dietary restrictions, and caloric targets.

## 🚀 Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose schemas)
- **AI Engine**: Google Gemini API, OpenAI API (or a high-fidelity local rules-based fallback engine)

---

## ✨ Core Features

1. **User Authentication**: Secure JWT-based signup, login, and profile validation.
2. **Onboarding Wizard**: Calculates BMR, TDEE, and daily macro targets (Protein, Carbs, Fats) scientifically using the Mifflin-St Jeor equation.
3. **Dashboard Stats**: Displays circular progress rings for calories, macronutrient progress bars, warnings for items expiring soon, and interactive water loggers.
4. **Pantry Inventory Manager**: Statically tracks kitchen stocks (e.g. Eggs, Paneer, Milk) with color-coded expiry alerts.
5. **Conversational Chatbot**: An agentic copilot with memory of your health goals, remaining calorie targets, and active pantry items.
6. **Log & Track (Diary)**: Supports natural language logging (e.g., *"I ate 2 eggs and a banana"*), translating descriptions into macro data using AI.
7. **7-Day Meal Planner**: Generates weekly meal plans using active pantry items and expiring stocks.
8. **Grocery Checklist**: Synced checklist that recommends missing ingredients and shopping items.
9. **History & Analytics**: Filterable reports (Day, Week, Month) with custom SVG progress charts.

---

## 📂 Directory Structure

```text
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # API routes controllers
│   ├── middleware/      # JWT authorization guards
│   ├── models/          # MongoDB Mongoose Schemas
│   ├── routes/          # Express API route configurations
│   ├── services/        # AI Service (Gemini/OpenAI/Mock)
│   └── server.js        # Server entry point
│
└── frontend/
    ├── src/
    │   ├── app/         # Next.js App Router folders
    │   ├── components/  # Layout sidebars & headers
    │   ├── context/     # Auth state context manager
    │   └── utils/       # Client fetch utilities
```

---

## 🛠️ How to Run the Project

### Pre-requisites
Make sure you have Node.js and a local MongoDB instance running on port `27017`.

### 1. Run the Backend API Server
```bash
cd backend
npm install
npm run dev
```
Starts backend server on [http://localhost:5000](http://localhost:5000).

### 2. Run the Next.js Client
```bash
cd frontend
npm install
npm run dev
```
Starts the Next.js development server on [http://localhost:3000](http://localhost:3000).

---

## ⚙️ AI Engine Key Settings
By default, the application uses a **high-fidelity local mock engine** containing food databases, recipes, and conversational triggers. 

To use live LLM APIs:
1. Log in and navigate to the **Settings** page.
2. Under **AI Configuration**, select **Google Gemini API** or **OpenAI GPT API**.
3. Paste your API key and click **Save**. The backend will immediately route all recipe recommendations, chat threads, and nutrition logs through the live API.
