# Pet Sarcasm 🐾

A VS Code extension that brings an adorable pet to judge your code errors. When you have an **error**, a pet (Cat or Dog) walks in, leaves a "gift" (💩) on your screen, and walks away unbothered.

[GitHub Repository](https://github.com/SvsDhanush/PetJudgeExtension)

## Features

- **Judgmental Pets**: Choose between a Cat and a Dog to judge your coding mistakes.
- **Auto-Judgment**: The pet automatically appears when you have build errors, task failures, or diagnostic errors.
- **Customizable**:
  - Toggle the extension on/off.
  - Choose your default pet character.
  - Enable/Disable auto-opening the sidebar on error.
- **Fun Animations**: Smooth SVG animations for walking, squatting, and leaving reviews.
- **Random Mode**: A dedicated button to randomize the pet on every error.

## Extension Settings

You can modify these settings in VS Code by going to **File > Preferences > Settings** (or `Cmd+,` / `Ctrl+,`) and searching for "Pet Judge".

* `petJudge.autoOpenSidebar`: Automatically open the Pet Judge sidebar when a new error occurs (default: `true`).
    * *Note: If disabled, the pet will still judge your code, but you will need to manually open the Pet Judge sidebar to see the animation.*
* `petJudge.defaultCharacter`: The default pet character to display (`dog`, `cat`, or `random`, default: `dog`).

## Commands

- `Pet Judge: Trigger Animation (Test)`: Manually trigger the pet to appear.
- `Pet Judge: Toggle On/Off`: Quickly enable or disable the pet's judgment.

## Known Issues

- The pet might be too cute to handle.

## Release Notes

### 1.0.0
- Initial release of Pet Judge.
- Added Cat and Dog characters.
- Added customization for auto-opening sidebar and default pet.
- Support for task failures and diagnostic errors.
