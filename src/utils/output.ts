import chalk from 'chalk'

export function success(message: string): void {
  console.log(chalk.green('✓'), message)
}

export function error(message: string): void {
  console.error(chalk.red('✗'), message)
}

export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message)
}

export function warn(message: string): void {
  console.log(chalk.yellow('⚠'), message)
}

export function json(data: unknown): void {
  console.log(JSON.stringify(data, null, 2))
}

// Strip ANSI escape codes for accurate column width calculation
function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*m/g, '')
}

export function table(
  headers: string[],
  rows: string[][],
): void {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => stripAnsi(r[i] ?? '').length))
  )

  const separator = colWidths.map((w) => '─'.repeat(w + 2)).join('┼')
  const formatRow = (row: string[]) =>
    row
      .map((cell, i) => {
        const visible = stripAnsi(cell ?? '')
        const pad = colWidths[i] - visible.length
        return ` ${cell ?? ''}${' '.repeat(Math.max(0, pad))} `
      })
      .join('│')

  console.log(chalk.bold(formatRow(headers)))
  console.log(separator)
  rows.forEach((row) => console.log(formatRow(row)))
}

export function statusColor(status: string): string {
  switch (status) {
    case 'completed':
      return chalk.green(status)
    case 'queued':
      return chalk.yellow(status)
    case 'in_progress':
      return chalk.blue(status)
    case 'failed':
      return chalk.red(status)
    case 'nsfw':
      return chalk.magenta(status)
    default:
      return status
  }
}
