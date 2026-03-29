#!/usr/bin/env node

import { Command } from 'commander'
import { createImageCommand } from './commands/image.js'
import { createVideoCommand } from './commands/video.js'
import { createStatusCommand } from './commands/status.js'
import { createModelsCommand } from './commands/models.js'
import { createStylesCommand } from './commands/styles.js'
import { createMotionsCommand } from './commands/motions.js'
import { createUploadCommand } from './commands/upload.js'
import { createCharactersCommand } from './commands/characters.js'
import { createConfigCommand } from './commands/config.js'

const program = new Command()

program
  .name('mediagen')
  .description(
    'AI media generation CLI — generate images and videos from text prompts.\n\n' +
      'Supports multiple providers (Gemini, Freepik, Higgsfield).\n' +
      'Each command has its own --help with examples.'
  )
  .version('0.1.0', '-v, --version')

program.addCommand(createImageCommand())
program.addCommand(createVideoCommand())
program.addCommand(createStatusCommand())
program.addCommand(createModelsCommand())
program.addCommand(createStylesCommand())
program.addCommand(createMotionsCommand())
program.addCommand(createUploadCommand())
program.addCommand(createCharactersCommand())
program.addCommand(createConfigCommand())

program.parse()
