# Scrum Dealer

Scrum Dealer is a task management web application that combines two major agile approaches: **PERT** and **Scrum**.  
It automates task duration calculation, generates PERT diagrams, and helps visualize project workflows in a clear and academic-friendly way.

This project was initially built to solve an academic problem—manual calculation of task durations and hand-drawn PERT diagrams—and evolved into a progressive software solution with real project management features.

---

## Project Objectives

- Automate task duration calculations
- Generate and visualize PERT diagrams
- Combine academic agile concepts with practical software
- Provide a lightweight project management tool for learning and demonstration

---

## Target Users

- **Students**: verify answers and visualize PERT diagrams  
- **Teachers**: demonstrate PERT and agile concepts  
- **Project managers / Scrum masters**: organize and visualize project tasks  

---

## Features

### PERT Diagram Generator

- Automatically generates a PERT diagram based on calculated task durations  
- Diagram visualization is implemented using D3.js  

### Task Management

- Create tasks with descriptions  
- Add subtasks  
- Assign responsibility to a teammate  

### PDF Report Export

- Export the entire project as a PDF report  
- Includes project name, project manager, tasks, and PERT diagram  

### Role-Based Usage

- Designed for use by a Scrum Master, Project Manager, or Reporter  

---

## Technologies Used

- **React.js** – for building a dynamic and interactive UI  
- **D3.js** – for shaping and visualizing the PERT diagram  
- **jsPDF** – for generating PDF reports  
- **html2canvas** – for capturing UI elements and diagrams for export  

---

## Application Type

- Web application  
- Planned evolution into a downloadable desktop software  

---

There is no backend or database at the moment, as the application does not require data persistence yet.

---

## Data Management

- No database
- No backend
- All data is handled in-memory for calculation, visualization, and export purposes

---

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

In the project directory, run:

```bash
npm install
npm start

The app runs in development mode.
Open http://localhost:3000
to view it in the browser.

The page will reload when you make changes.
