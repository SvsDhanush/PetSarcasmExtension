# Pet Sarcasm 🐾

A VS Code extension that brings an adorable pet to judge your code errors. Your pet roams the sidebar and, whenever you make an **error**, it stops to leave a "gift" (💩) and a snarky comment.

[GitHub Repository](https://github.com/SvsDhanush/PetJudgeExtension)

## Features

- **Judgmental Pets**: Choose between a Cat and a Dog to roam your sidebar.
- **Roaming Life**: The pet stays in the sidebar, walking and resting until it detects an error.
- **Auto-Judgment**: The pet poops wherever it stands when it detects build errors, task failures, or diagnostic errors.
- **Customizable**:
  - Toggle the extension on/off.
  - Choose your default pet character.
  - Enable/Disable auto-opening the sidebar on error.
- **Fun Animations**: Smooth SVG animations for roaming, squatting, and snarky speech bubbles.

## Extension Settings

You can modify these settings in VS Code by going to **File > Preferences > Settings** (or `Cmd+,` / `Ctrl+,`) and searching for "Pet Judge".

* `petJudge.autoOpenSidebar`: Automatically open the Pet Judge sidebar when a new error occurs (default: `true`).
    * *Note: If disabled, the pet will still judge your code, but you will need to manually open the Pet Judge sidebar to see the animation.*
* `petJudge.defaultCharacter`: The default pet character to display (`dog` or `cat`, default: `dog`).

## Commands

- `Pet Judge: Trigger Animation (Test)`: Manually trigger the pet to appear.
- `Pet Judge: Toggle On/Off`: Quickly enable or disable the pet's judgment.

## Known Issues

- The pet might be too cute to handle.

## Terminal Errors Not Detecting?
If errors in your terminal (PowerShell, Bash, etc.) aren't triggering the pet, you likely need to enable **Shell Integration**. 
- Look for colored circles in your terminal's left margin.
- If they are missing, check your VS Code settings for `Terminal › Integrated › Shell Integration: Enabled`.
- Note: On some restricted laptops, Shell Integration may be blocked by security policies.

## Release Notes

### 1.0.0
- Initial release of Pet Judge.
- Added Cat and Dog characters.
- Added customization for auto-opening sidebar and default pet.
- Support for task failures and diagnostic errors.
