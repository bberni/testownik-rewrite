# Migration From Testownik Electron

## Quick Start

1. Open [testownik-web](https://github.com/bberni/testownik-rewrite) in a modern browser (Chrome 90+, Firefox 90+, Safari 15+).
2. Use **"Wybierz folder"** or drag-and-drop a quiz folder to import.
3. All data stays local — no uploads, no accounts.

## Importing Quizzes

### Import a Quiz Folder

The web app imports quiz folders the same way as the Electron app:

- **Desktop**: Click "Wybierz folder" or drag-and-drop the quiz folder.
- **Mobile**: Tap "Wybierz folder". File/folder picking depends on your mobile OS and browser.

Supported quiz formats:
- Single-answer format (`X` type) with Polish `[ ]` / `[x]` brackets.
- Select-answer format (`Y` type) with `{wybór N}` / `{wybor N}` placeholders.
- UTF-8 and Windows-1250 encoded files.
- Text and image content (question images, answer images, select option images).

### Import Save Progress

If you have an existing `save.json` from the Electron app:

1. Open the app and ensure the corresponding quiz is already imported.
2. Click **"Zaimportuj save.json"** below the import area.
3. Select your saved progress file. The app will automatically match it to the correct quiz by tag names.

### Export Save Progress

In the quiz sidebar, click the download icon (**Eksportuj save.json**) to save your current progress as a `save.json` file compatible with the Electron `save.json` format.

## Browser Storage Model

Unlike the Electron app (which writes `save.json` to the quiz folder on disk), the web app stores everything in your browser's **IndexedDB**:

| What | Where |
|------|-------|
| Quiz questions and metadata | IndexedDB (quiz store) |
| Images and assets | IndexedDB (assets store) |
| Quiz progress and reoccurrences | IndexedDB (sessions store) |
| Settings and theme | IndexedDB (settings store) |
| Recent quiz list | IndexedDB (recents store) |
| Timer and progress | IndexedDB (autosaved every 30s + on visibility change) |

All data is **private** and never leaves your browser.

### Progress Safety

- Timer and answers are autosaved every 30 seconds and when you switch tabs.
- Refreshing or closing the browser preserves your progress.
- After finishing a quiz, you can always start a new session or export your progress.

## Troubleshooting

### Storage quota exceeded

**Symptom**: Quiz import fails or progress stops saving.  
**Cause**: Browser storage limits (varies by browser, usually ~60-80% of disk free space).  
**Fix**: Delete unused quizzes from the library to free space. Check browser settings > Site Settings > Storage.

### Unsupported browser

**Symptom**: App shows a blank page or import doesn't work.  
**Cause**: Browser doesn't support IndexedDB, File System Access API, or other required APIs.  
**Fix**: Use Chrome 90+, Firefox 90+, or Safari 15+. The app falls back to `<input type="file">` if File System Access API is not available.

### Missing images in quiz

**Symptom**: Quiz shows broken image placeholders instead of images.  
**Cause**: Image files were not included in the imported folder, or image filenames reference paths outside the folder.  
**Fix**: Re-import the quiz folder ensuring all image files are present. Images must be in the same folder or a subdirectory of the quiz folder.

### Encoding issues (garbled text)

**Symptom**: Polish characters (ą, ę, ś, ć, ń, ó, ł, ż, ź) display as garbage.  
**Cause**: The quiz `.txt` file may use a non-standard encoding not detected as Windows-1250.  
**Fix**: The parser auto-detects UTF-8 vs Windows-1250. Ensure the `.txt` file is saved as UTF-8 or Windows-1250. If the issue persists, re-save the file as UTF-8 with BOM or without BOM.

### Save.json import fails

**Symptom**: "Nie znaleziono quizu pasującego do pliku save.json".  
**Cause**: The save.json reoccurrence tags don't match any imported quiz's question tags.  
**Fix**: Import the quiz folder first, then import the save.json. The match is based on tag filenames (e.g., `questions.txt`).

**Symptom**: "Quiz ma już aktywną sesję".  
**Cause**: You already have an in-progress session for the matching quiz.  
**Fix**: Finish the current session or start a new one, then import the save.json.

## Differences From Electron App

| Feature | Electron | Web |
|---------|----------|-----|
| Quiz storage | Local filesystem folder | IndexedDB (browser) |
| save.json location | `<quiz-folder>/save.json` | IndexedDB + export button |
| Folder picker | Native OS dialog | File System Access API or file input |
| Data privacy | Local filesystem | Local browser storage (no network) |
| Autosave | Manual or on quit | Every 30s + tab visibility change |
| Theme persistence | Stored in quiz folder | IndexedDB, survives quiz deletion |
