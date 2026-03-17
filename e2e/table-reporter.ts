import type {
    FullResult,
    Reporter,
    TestCase,
    TestResult,
} from '@playwright/test/reporter';

// ---------------------------------------------------------------------------
// Symbols & colours (ANSI escape codes)
// ---------------------------------------------------------------------------

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

function green(s: string) { return `${GREEN}${s}${RESET}`; }
function red(s: string) { return `${RED}${s}${RESET}`; }
function yellow(s: string) { return `${YELLOW}${s}${RESET}`; }
function bold(s: string) { return `${BOLD}${s}${RESET}`; }
function dim(s: string) { return `${DIM}${s}${RESET}`; }
function cyan(s: string) { return `${CYAN}${s}${RESET}`; }

const STATUS_ICON: Record<string, string> = {
    passed: green('✓'),
    failed: red('✘'),
    timedOut: red('⏱'),
    skipped: yellow('–'),
    interrupted: yellow('!'),
};

// ---------------------------------------------------------------------------
// Table helpers
// ---------------------------------------------------------------------------

/** Strip ANSI escape codes to get the printable length of a string. */
function visibleLength(s: string): number {
    // eslint-disable-next-line no-control-regex
    return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}

function pad(s: string, width: number, align: 'left' | 'right' = 'left'): string {
    const len = visibleLength(s);
    const padding = ' '.repeat(Math.max(0, width - len));
    return align === 'left' ? s + padding : padding + s;
}

function hRule(widths: number[], char = '─'): string {
    return widths.map((w) => char.repeat(w + 2)).join('┼');
}

function topBorder(widths: number[]): string {
    return `┌${widths.map((w) => '─'.repeat(w + 2)).join('┬')}┐`;
}

function midBorder(widths: number[]): string {
    return `├${hRule(widths)}┤`;
}

function botBorder(widths: number[]): string {
    return `└${widths.map((w) => '─'.repeat(w + 2)).join('┴')}┘`;
}

function row(cells: string[], widths: number[]): string {
    const cols = cells.map((c, i) => ` ${pad(c, widths[i])} `).join('│');
    return `│${cols}│`;
}

// ---------------------------------------------------------------------------
// Reporter
// ---------------------------------------------------------------------------

interface RowData {
    n: number;
    suite: string;
    title: string;
    status: string;
    rawStatus: string;
    duration: number;
}

class TableReporter implements Reporter {
    private rows: RowData[] = [];
    private counter = 0;
    private startedAt = Date.now();

    onBegin() {
        this.startedAt = Date.now();
    }

    onTestEnd(test: TestCase, result: TestResult) {
        this.counter += 1;
        const parts = test.titlePath().filter(Boolean);
        const suite = parts.slice(0, -1).join(' › ');
        const title = parts[parts.length - 1] ?? '';
        const rawStatus = result.status;
        const icon = STATUS_ICON[rawStatus] ?? yellow('?');
        const statusLabel = rawStatus === 'passed' ? green('passed')
            : rawStatus === 'failed' ? red('failed')
            : rawStatus === 'timedOut' ? red('timed out')
            : rawStatus === 'skipped' ? yellow('skipped')
            : yellow(rawStatus);

        this.rows.push({
            n: this.counter,
            suite,
            title,
            status: `${icon} ${statusLabel}`,
            rawStatus,
            duration: result.duration,
        });
    }

    onEnd(result: FullResult) {
        const totalMs = Date.now() - this.startedAt;

        // Column headers (plain text for width calculation)
        const headers = ['#', 'Suite', 'Test', 'Status', 'Duration'];

        // Build plain-text column data for width measuring
        const colData: string[][] = this.rows.map((r) => [
            String(r.n),
            r.suite,
            r.title,
            `${r.rawStatus === 'passed' ? '✓' : '✘'} ${r.rawStatus}`,
            `${r.duration} ms`,
        ]);

        // Compute column widths (header vs data)
        const widths = headers.map((h, i) => {
            const maxData = Math.max(...colData.map((row) => row[i].length));
            return Math.max(h.length, maxData);
        });

        // Styled column data (ANSI colours)
        const styledData = this.rows.map((r) => [
            dim(String(r.n)),
            r.suite,
            r.title,
            r.status,
            dim(`${r.duration} ms`),
        ]);

        const styledHeaders = headers.map((h) => bold(cyan(h)));

        console.log('');
        console.log(topBorder(widths));
        console.log(row(styledHeaders, widths));
        console.log(midBorder(widths));

        styledData.forEach((cells, idx) => {
            console.log(row(cells, widths));
            if (idx < styledData.length - 1) {
                console.log(`├${widths.map((w) => dim('─'.repeat(w + 2))).join('┼')}┤`);
            }
        });

        console.log(botBorder(widths));

        // Summary line
        const passed = this.rows.filter((r) => r.rawStatus === 'passed').length;
        const failed = this.rows.filter((r) => r.rawStatus === 'failed').length;
        const skipped = this.rows.filter((r) => r.rawStatus === 'skipped').length;
        const total = this.rows.length;

        const parts: string[] = [
            bold(`${total} tests`),
            passed ? green(`${passed} passed`) : '',
            failed ? red(`${failed} failed`) : '',
            skipped ? yellow(`${skipped} skipped`) : '',
            dim(`${(totalMs / 1000).toFixed(1)} s`),
        ].filter(Boolean);

        console.log('');
        const overallIcon = result.status === 'passed' ? green('✓') : red('✘');
        console.log(`  ${overallIcon}  ${parts.join('  ·  ')}`);
        console.log('');
    }
}

export default TableReporter;
