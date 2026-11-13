# TrueLabel Team Git & GitHub Workflow Guide

This guide outlines the standard **Fork & Branch Workflow** for our 4-member team collaborating on **[shovon05/TrueLabel](https://github.com/shovon05/TrueLabel)**.

---

## Understanding the Setup

Every team member works across three locations:
1. **`upstream` (Production Repo):** `https://github.com/shovon05/TrueLabel` — The official shared repository.
2. **`origin` (Your Fork):** `https://github.com/<YOUR-USERNAME>/TrueLabel` — Your personal copy on GitHub.
3. **Local Machine:** The folder on your computer where you write code.

> **Golden Rule:** Never write code or make commits directly on your `main` branch. Always keep `main` as a clean mirror of `upstream/main`, and build every new feature on its own dedicated branch.

---

## Phase 1: One-Time Setup (For New Team Members)

Follow these steps **once** when joining the project:

### 1. Fork the Repository
1. Go to [https://github.com/shovon05/TrueLabel](https://github.com/shovon05/TrueLabel).
2. Click the **Fork** button in the top-right corner and click **Create fork**.

### 2. Clone Your Fork Locally
Open your terminal, navigate to where you keep your projects, and clone **your fork** (replace `<YOUR-USERNAME>` with your GitHub username):
```bash
git clone https://github.com/<YOUR-USERNAME>/TrueLabel.git
cd TrueLabel
```

### 3. Connect the Upstream Repository
Link your local repository to the main team repository so you can pull updates from your teammates:
```bash
git remote add upstream https://github.com/shovon05/TrueLabel.git
```

**Verify your remotes:**
```bash
git remote -v
```
You should see four lines pointing `origin` to your fork and `upstream` to `shovon05/TrueLabel`.

---

## Phase 2: Starting & Building a New Feature

Whenever you are ready to work on a new task or feature (for example, `F17`):

### 1. Sync Your `main` Branch First
Make sure you are starting from the latest code merged by your teammates:
```bash
git switch main
git pull upstream main
git push origin main
```

### 2. Create a New Feature Branch
Create and switch to a new branch named after your feature/task ID:
```bash
git switch -c F17
```
*(Tip: Descriptive names like `F17-user-login` also work great so teammates know what you are building.)*

### 3. Write Code and Commit Your Work
As you build the feature, save your progress with clear, descriptive commits:
```bash
git status
git add .
git commit -m "Implement F17 feature description"
```

---

## Phase 3: Submitting Your Feature to Production (Pull Request)

Once your feature is complete, tested, and ready to go into `shovon05/TrueLabel`:

### 1. Sync with Latest `upstream/main`
Before pushing, pull any changes your teammates merged while you were working and replay your commits cleanly on top:
```bash
git fetch upstream
git rebase upstream/main
```

> **What if a merge conflict happens during rebase?**
> 1. Run `git status` to see which files have conflicts.
> 2. Open those files, fix the `<<<<<<<` / `>>>>>>>` conflict markers, and save.
> 3. Run `git add .` and then `git rebase --continue`.

### 2. Push Your Feature Branch to Your Fork (`origin`)
```bash
git push -u origin F17
```

### 3. Open a Pull Request (PR)
1. Go to your fork on GitHub (`https://github.com/<YOUR-USERNAME>/TrueLabel`).
2. Click the yellow **Compare & pull request** banner at the top.
3. Double-check the branch dropdowns at the top of the PR page:
   * **base repository:** `shovon05/TrueLabel` | **base:** `main`
   * **head repository:** `<YOUR-USERNAME>/TrueLabel` | **compare:** `F17`
4. Write a short summary of what you built and click **Create pull request**.

### 4. Review & Merge
Wait for a teammate to review your code (or merge it if you have maintainer approval) into `shovon05/TrueLabel`.

---

## Phase 4: Post-Merge Cleanup (After Your PR is Merged)

**Do NOT manually merge `F17` into your fork's `main` branch.** Instead, pull the official merged result down from `upstream` and delete your old branch:

### 1. Update Local `main` from `upstream`
```bash
git switch main
git pull upstream main
```

### 2. Update Your GitHub Fork's `main`
```bash
git push origin main
```

### 3. Delete the Finished Feature Branch
Clean up the old branch both locally and on your GitHub fork:
```bash
git branch -d F17
git push origin --delete F17
```

You are now completely synced and ready to repeat **Phase 2** for your next feature!

---

## Team Best Practices (4-Member Coordination)

* **Starting a second feature while your first PR is still waiting for review:**
  * **If the new feature (`F18`) does NOT depend on `F17`:** Switch back to `main` (`git switch main`), pull `upstream/main`, and branch off `main` (`git switch -c F18`).
  * **If `F18` DOES depend on code in `F17`:** Branch directly off `F17` (`git switch F17` then `git switch -c F18`). Wait until `F17` is merged before opening the PR for `F18`.
* **Keep PRs small and focused:** One feature or bug fix per branch makes code reviews faster and prevents large merge conflicts among the 4 members.
* **Pull often:** Run `git fetch upstream` and `git rebase upstream/main` on your active feature branch once a day if teammates are merging code frequently.

---

## Quick Command Cheat Sheet

| Action | Commands |
| :--- | :--- |
| **Start a new feature** | `git switch main` → `git pull upstream main` → `git switch -c <branch>` |
| **Save work locally** | `git add .` → `git commit -m "message"` |
| **Sync before PR** | `git fetch upstream` → `git rebase upstream/main` |
| **Upload branch for PR** | `git push -u origin <branch>` |
| **Clean up after PR merge** | `git switch main` → `git pull upstream main` → `git push origin main` → `git branch -d <branch>` |