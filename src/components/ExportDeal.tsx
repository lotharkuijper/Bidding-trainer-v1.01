import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Deal, BiddingState, Direction, Vulnerability, BidPlayer, Hand, Card } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { Toast } from './Toast';

interface ExportDealProps {
  deal: Deal;
  biddingState: BiddingState;
  dealer: Direction;
  vulnerability: Vulnerability;
  dealNumber: number;
}

const SUIT_SYMBOLS = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const SUIT_COLORS = {
  spades: '#000000',
  hearts: '#DC2626',
  diamonds: '#DC2626',
  clubs: '#000000',
};

export function ExportDeal({ deal, biddingState, dealer, vulnerability, dealNumber }: ExportDealProps) {
  const { t, language } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const getVulnerabilityText = (vuln: Vulnerability): string => {
    const map: Record<Vulnerability, string> = {
      none: language === 'en' ? 'None' : 'Geen',
      ns: language === 'en' ? 'NS' : 'NZ',
      ew: language === 'en' ? 'EW' : 'OW',
      both: language === 'en' ? 'Both' : 'Allen',
    };
    return map[vuln];
  };

  const getDealerText = (dir: Direction): string => {
    const map: Record<Direction, string> = {
      north: language === 'en' ? 'North' : 'Noord',
      south: language === 'en' ? 'South' : 'Zuid',
      east: language === 'en' ? 'East' : 'Oost',
      west: language === 'en' ? 'West' : 'West',
    };
    return map[dir];
  };

  const getPlayerText = (player: BidPlayer): string => {
    const map: Record<BidPlayer, string> = {
      north: language === 'en' ? 'N' : 'N',
      south: language === 'en' ? 'S' : 'Z',
      east: language === 'en' ? 'E' : 'O',
      west: language === 'en' ? 'W' : 'W',
    };
    return map[player];
  };

  const formatHand = (hand: Hand | undefined | null): string => {
    console.log('formatHand called with:', hand);

    if (!hand || !hand.cards || !Array.isArray(hand.cards)) {
      console.error('Invalid hand data:', hand);
      return `
        <div style="font-family: 'Courier New', monospace; font-size: 14px;">
          <div><span style="color: ${SUIT_COLORS.spades}; font-weight: bold;">${SUIT_SYMBOLS.spades}</span> -</div>
          <div><span style="color: ${SUIT_COLORS.hearts}; font-weight: bold;">${SUIT_SYMBOLS.hearts}</span> -</div>
          <div><span style="color: ${SUIT_COLORS.diamonds}; font-weight: bold;">${SUIT_SYMBOLS.diamonds}</span> -</div>
          <div><span style="color: ${SUIT_COLORS.clubs}; font-weight: bold;">${SUIT_SYMBOLS.clubs}</span> -</div>
        </div>
      `;
    }

    const suits = {
      spades: hand.cards.filter(c => c.suit === 'spades'),
      hearts: hand.cards.filter(c => c.suit === 'hearts'),
      diamonds: hand.cards.filter(c => c.suit === 'diamonds'),
      clubs: hand.cards.filter(c => c.suit === 'clubs'),
    };

    const rankOrder = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
    const sortBySuit = (cards: Card[]) => {
      return cards
        .sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank))
        .map(c => c.rank)
        .join(' ') || '-';
    };

    return `
      <div style="font-family: 'Courier New', monospace; font-size: 14px;">
        <div><span style="color: ${SUIT_COLORS.spades}; font-weight: bold;">${SUIT_SYMBOLS.spades}</span> ${sortBySuit(suits.spades)}</div>
        <div><span style="color: ${SUIT_COLORS.hearts}; font-weight: bold;">${SUIT_SYMBOLS.hearts}</span> ${sortBySuit(suits.hearts)}</div>
        <div><span style="color: ${SUIT_COLORS.diamonds}; font-weight: bold;">${SUIT_SYMBOLS.diamonds}</span> ${sortBySuit(suits.diamonds)}</div>
        <div><span style="color: ${SUIT_COLORS.clubs}; font-weight: bold;">${SUIT_SYMBOLS.clubs}</span> ${sortBySuit(suits.clubs)}</div>
      </div>
    `;
  };

  const formatBiddingSequence = (): string => {
    try {
      const columns = ['west', 'north', 'east', 'south'] as BidPlayer[];

      const getColumnIndex = (player: BidPlayer): number => {
        return columns.indexOf(player);
      };

      const dealerIndex = getColumnIndex(dealer as BidPlayer);

      let headerRow = '<tr style="background-color: #f3f4f6; font-weight: bold;">';
      columns.forEach(col => {
        headerRow += `<td style="padding: 8px; border: 1px solid #d1d5db; text-align: center;">${getPlayerText(col)}</td>`;
      });
      headerRow += '</tr>';

      const rows: (typeof biddingState.bids[0] | null)[][] = [];
      let currentRow: (typeof biddingState.bids[0] | null)[] = [null, null, null, null];

      for (let i = 0; i < dealerIndex; i++) {
        currentRow[i] = null;
      }

      biddingState.bids.forEach((bid, index) => {
        const columnIndex = getColumnIndex(bid.player);
        if (columnIndex !== -1) {
          currentRow[columnIndex] = bid;

          if (columnIndex === 3 && index < biddingState.bids.length - 1) {
            rows.push(currentRow);
            currentRow = [null, null, null, null];
          }
        }
      });

      if (currentRow.some(cell => cell !== null)) {
        rows.push(currentRow);
      }

      let bodyRows = '';
      rows.forEach(row => {
        bodyRows += '<tr>';
        row.forEach(bid => {
          let bidText = '';
          if (bid) {
            if (bid.bidType === 'pass') {
              bidText = t('export.pass');
            } else if (bid.bidType === 'double') {
              bidText = t('export.double');
            } else if (bid.bidType === 'redouble') {
              bidText = t('export.redouble');
            } else if (bid.bidType === 'bid' && bid.level && bid.suit) {
              const suitSymbol = bid.suit === 'notrump' ? 'SA' : SUIT_SYMBOLS[bid.suit];
              const suitColor = bid.suit === 'notrump' ? '#000000' : SUIT_COLORS[bid.suit];
              bidText = `${bid.level}<span style="color: ${suitColor}; font-weight: bold;">${suitSymbol}</span>`;
            }
          }
          bodyRows += `<td style="padding: 8px; border: 1px solid #d1d5db; text-align: center;">${bidText}</td>`;
        });
        bodyRows += '</tr>';
      });

      return `
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          ${headerRow}
          ${bodyRows}
        </table>
      `;
    } catch (error) {
      console.error('Error formatting bidding sequence:', error);
      return '<p>Error formatting bidding sequence</p>';
    }
  };

  const generateHTML = (): string => {
    try {
      console.log('generateHTML - deal object:', deal);
      console.log('generateHTML - deal.north:', deal.north);
      console.log('generateHTML - deal.south:', deal.south);
      console.log('generateHTML - deal.east:', deal.east);
      console.log('generateHTML - deal.west:', deal.west);

      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${t('export.title')} #${dealNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 21cm;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      font-size: 24pt;
      margin-bottom: 20px;
      text-align: center;
      color: #1e40af;
    }
    h2 {
      font-size: 16pt;
      margin-top: 24px;
      margin-bottom: 12px;
      color: #1e40af;
      border-bottom: 2px solid #1e40af;
      padding-bottom: 4px;
    }
    .info-section {
      display: flex;
      justify-content: space-around;
      margin-bottom: 24px;
      padding: 12px;
      background-color: #f3f4f6;
      border-radius: 8px;
    }
    .info-item {
      text-align: center;
    }
    .info-label {
      font-weight: bold;
      color: #4b5563;
      font-size: 10pt;
    }
    .info-value {
      font-size: 14pt;
      color: #1e40af;
      font-weight: bold;
    }
    .hands-diagram {
      display: grid;
      grid-template-areas:
        ". north ."
        "west . east"
        ". south .";
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin: 24px 0;
    }
    .hand {
      padding: 12px;
      border: 2px solid #d1d5db;
      border-radius: 8px;
      background-color: #ffffff;
    }
    .hand-title {
      font-weight: bold;
      margin-bottom: 8px;
      text-align: center;
      color: #1e40af;
      font-size: 12pt;
    }
    .hand-north { grid-area: north; }
    .hand-south { grid-area: south; }
    .hand-east { grid-area: east; }
    .hand-west { grid-area: west; }
    .notes-box {
      margin-top: 32px;
      padding: 16px;
      border: 2px solid #1e40af;
      border-radius: 8px;
      min-height: 120px;
      background-color: #ffffff;
    }
    .notes-title {
      font-weight: bold;
      font-size: 14pt;
      color: #1e40af;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td, th {
      padding: 8px;
      border: 1px solid #d1d5db;
      text-align: center;
    }
    @media print {
      body {
        padding: 0;
      }
      .notes-box {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>${t('app.title')} - ${t('export.dealNumber')} #${dealNumber}</h1>

  <div class="info-section">
    <div class="info-item">
      <div class="info-label">${t('export.dealer')}</div>
      <div class="info-value">${getDealerText(dealer)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">${t('export.vulnerability')}</div>
      <div class="info-value">${getVulnerabilityText(vulnerability)}</div>
    </div>
  </div>

  <h2>${t('export.hands')}</h2>
  <div class="hands-diagram">
    <div class="hand hand-north">
      <div class="hand-title">${getDealerText('north')}</div>
      ${formatHand(deal.north)}
    </div>
    <div class="hand hand-west">
      <div class="hand-title">${getDealerText('west')}</div>
      ${formatHand(deal.west)}
    </div>
    <div class="hand hand-east">
      <div class="hand-title">${getDealerText('east')}</div>
      ${formatHand(deal.east)}
    </div>
    <div class="hand hand-south">
      <div class="hand-title">${getDealerText('south')}</div>
      ${formatHand(deal.south)}
    </div>
  </div>

  <h2>${t('export.biddingSequence')}</h2>
  ${formatBiddingSequence()}

  <div class="notes-box">
    <div class="notes-title">${t('export.notes')}</div>
    <div style="min-height: 80px;"></div>
  </div>
</body>
</html>
    `;
    } catch (error) {
      console.error('Error generating HTML:', error);
      throw error;
    }
  };

  const handleExportPDF = () => {
    try {
      console.log('Starting PDF export...');
      const html = generateHTML();
      console.log('HTML generated successfully');

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      console.log('Blob created:', url);

      const link = document.createElement('a');
      link.href = url;
      link.download = `bridge-deal-${dealNumber}.html`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);

      setToastMessage(language === 'en'
        ? `Deal #${dealNumber} downloaded to your Downloads folder`
        : `Spel #${dealNumber} gedownload naar je Downloads-map`);
      setShowToast(true);
      setShowMenu(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert((language === 'en' ? 'Error exporting deal: ' : 'Fout bij exporteren van spel: ') + errorMsg);
    }
  };

  const generateRTF = (): string => {
    // Format hands for RTF
    const formatHandForRTF = (hand: Hand | undefined | null): string => {
      if (!hand || !hand.cards || !Array.isArray(hand.cards)) {
        return `{\\cf1 \\u9824?} -\\line\n{\\cf2 \\u9829?} -\\line\n{\\cf2 \\u9830?} -\\line\n{\\cf1 \\u9827?} -\\line\n`;
      }

      const suits = {
        spades: hand.cards.filter(c => c.suit === 'spades'),
        hearts: hand.cards.filter(c => c.suit === 'hearts'),
        diamonds: hand.cards.filter(c => c.suit === 'diamonds'),
        clubs: hand.cards.filter(c => c.suit === 'clubs'),
      };

      const rankOrder = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
      const sortBySuit = (cards: Card[]) => {
        return cards
          .sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank))
          .map(c => c.rank)
          .join(' ') || '-';
      };

      // Unicode values: spades=9824, hearts=9829, diamonds=9830, clubs=9827
      // cf1=black, cf2=red
      return `{\\cf1 \\u9824?} ${sortBySuit(suits.spades)}\\line\n{\\cf2 \\u9829?} ${sortBySuit(suits.hearts)}\\line\n{\\cf2 \\u9830?} ${sortBySuit(suits.diamonds)}\\line\n{\\cf1 \\u9827?} ${sortBySuit(suits.clubs)}\\line\n`;
    };

    // Format bidding sequence for RTF
    const formatBiddingForRTF = (): string => {
      const columns = ['west', 'north', 'east', 'south'] as BidPlayer[];
      const getColumnIndex = (player: BidPlayer): number => columns.indexOf(player);
      const dealerIndex = getColumnIndex(dealer as BidPlayer);

      let tableContent = '';

      // Header row
      tableContent += '\\trowd\\trgaph108\\trleft0\\trbrdrt\\brdrs\\brdrw10\\trbrdrl\\brdrs\\brdrw10\\trbrdrb\\brdrs\\brdrw10\\trbrdrr\\brdrs\\brdrw10\n';
      columns.forEach((_, i) => {
        const cellPos = (i + 1) * 2500;
        tableContent += `\\clbrdrt\\brdrw10\\brdrs\\clbrdrl\\brdrw10\\brdrs\\clbrdrb\\brdrw10\\brdrs\\clbrdrr\\brdrw10\\brdrs\\cellx${cellPos}\n`;
      });
      tableContent += '\\pard\\intbl\\qc\\b ' + columns.map(col => getPlayerText(col)).join('\\cell ') + '\\cell\\row\n';

      // Body rows
      const rows: (typeof biddingState.bids[0] | null)[][] = [];
      let currentRow: (typeof biddingState.bids[0] | null)[] = [null, null, null, null];

      for (let i = 0; i < dealerIndex; i++) {
        currentRow[i] = null;
      }

      biddingState.bids.forEach((bid, index) => {
        const columnIndex = getColumnIndex(bid.player);
        if (columnIndex !== -1) {
          currentRow[columnIndex] = bid;
          if (columnIndex === 3 && index < biddingState.bids.length - 1) {
            rows.push(currentRow);
            currentRow = [null, null, null, null];
          }
        }
      });

      if (currentRow.some(cell => cell !== null)) {
        rows.push(currentRow);
      }

      rows.forEach(row => {
        tableContent += '\\trowd\\trgaph108\\trleft0\\trbrdrt\\brdrs\\brdrw10\\trbrdrl\\brdrs\\brdrw10\\trbrdrb\\brdrs\\brdrw10\\trbrdrr\\brdrs\\brdrw10\n';
        columns.forEach((_, i) => {
          const cellPos = (i + 1) * 2500;
          tableContent += `\\clbrdrt\\brdrw10\\brdrs\\clbrdrl\\brdrw10\\brdrs\\clbrdrb\\brdrw10\\brdrs\\clbrdrr\\brdrw10\\brdrs\\cellx${cellPos}\n`;
        });
        tableContent += '\\pard\\intbl\\qc\\b0 ';
        row.forEach(bid => {
          let bidText = '';
          if (bid) {
            if (bid.bidType === 'pass') {
              bidText = t('export.pass');
            } else if (bid.bidType === 'double') {
              bidText = t('export.double');
            } else if (bid.bidType === 'redouble') {
              bidText = t('export.redouble');
            } else if (bid.bidType === 'bid' && bid.level && bid.suit) {
              const suitSymbol = bid.suit === 'notrump' ? 'SA' :
                (bid.suit === 'spades' ? '{\\cf1 \\u9824?}' :
                 bid.suit === 'hearts' ? '{\\cf2 \\u9829?}' :
                 bid.suit === 'diamonds' ? '{\\cf2 \\u9830?}' : '{\\cf1 \\u9827?}');
              bidText = `${bid.level}${suitSymbol}`;
            }
          }
          tableContent += bidText + '\\cell ';
        });
        tableContent += '\\row\n';
      });

      return tableContent;
    };

    const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}{\\f1\\fmodern\\fcharset0 Courier New;}}
{\\colortbl;\\red0\\green0\\blue0;\\red220\\green38\\blue38;}
\\paperw11906\\paperh16838\\margl1440\\margr1440\\margt1440\\margb1440

{\\pard\\qc\\b\\fs48 ${t('app.title')} - ${t('export.dealNumber')} #${dealNumber}\\par}
\\par

{\\pard\\qc\\fs24
{\\b ${t('export.dealer')}:} ${getDealerText(dealer)}\\~\\~\\~\\~
{\\b ${t('export.vulnerability')}:} ${getVulnerabilityText(vulnerability)}
\\par}
\\par

{\\pard\\b\\fs32 ${t('export.hands')}\\par}
\\par

{\\pard\\qc
{\\b ${getDealerText('north')}}\\line
\\f1\\fs20 ${formatHandForRTF(deal.north)}\\f0\\fs24
\\par}
\\par

{\\pard\\ql
{\\b ${getDealerText('west')}}\\tab\\tab\\tab{\\b ${getDealerText('east')}}\\line
\\f1\\fs20 ${formatHandForRTF(deal.west).replace(/\\line\n/g, '\\tab\\tab\\tab')}${formatHandForRTF(deal.east).replace(/\\line\n/g, '\\line\n')}\\f0\\fs24
\\par}
\\par

{\\pard\\qc
{\\b ${getDealerText('south')}}\\line
\\f1\\fs20 ${formatHandForRTF(deal.south)}\\f0\\fs24
\\par}
\\par

{\\pard\\b\\fs32 ${t('export.biddingSequence')}\\par}
\\par

${formatBiddingForRTF()}

\\par
{\\pard\\b\\fs28 ${t('export.notes')}\\par}
{\\pard\\box\\brdrs\\brdrw15 \\par\\par\\par\\par\\par\\par\\par}

}`;

    return rtfContent;
  };

  const handleExportWord = () => {
    try {
      console.log('Starting Word export...');
      const rtf = generateRTF();
      console.log('RTF generated successfully');

      const blob = new Blob([rtf], {
        type: 'application/rtf'
      });
      const url = URL.createObjectURL(blob);
      console.log('RTF blob created:', url);

      const link = document.createElement('a');
      link.href = url;
      link.download = `bridge-deal-${dealNumber}.rtf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);

      setToastMessage(language === 'en'
        ? `Deal #${dealNumber} downloaded to your Downloads folder`
        : `Spel #${dealNumber} gedownload naar je Downloads-map`);
      setShowToast(true);
      setShowMenu(false);
    } catch (error) {
      console.error('Error exporting Word:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert((language === 'en' ? 'Error exporting deal: ' : 'Fout bij exporteren van spel: ') + errorMsg);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-md min-h-[44px]"
        >
          <Download size={18} />
          {t('export.title')}
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
              <button
                onClick={handleExportPDF}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 font-medium flex items-center gap-2"
              >
                <FileText size={18} />
                {t('export.exportPDF')}
              </button>
              <button
                onClick={handleExportWord}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 font-medium flex items-center gap-2"
              >
                <FileText size={18} />
                {t('export.exportWord')}
              </button>
            </div>
          </>
        )}
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
