import '@testing-library/jest-dom';

// Mock global para jspdf
jest.mock('jspdf', () => {
  // Criamos mocks individuais para que possam ser verificados se necessário,
  // embora neste caso, os testes não os estejam verificando diretamente.
  const mockSave = jest.fn();
  const mockText = jest.fn();
  const mockAddPage = jest.fn();
  const mockSetPage = jest.fn();
  const mockSetFontSize = jest.fn();
  const mockSetFont = jest.fn();
  const mockLine = jest.fn();
  // mockSplitTextToSize precisa retornar um array de strings
  const mockSplitTextToSize = jest.fn((text, size) => (typeof text === 'string' ? text.split('\n') : [String(text)]));
  const mockHtml = jest.fn().mockResolvedValue(undefined); // Para ProtocoloEditor

  return jest.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: jest.fn().mockReturnValue(210),
        getHeight: jest.fn().mockReturnValue(297),
      },
      pages: [null, {}, {}], // Simula algumas páginas para .length
    },
    save: mockSave,
    text: mockText,
    addPage: mockAddPage,
    setPage: mockSetPage,
    setFontSize: mockSetFontSize,
    setFont: mockSetFont,
    line: mockLine,
    splitTextToSize: mockSplitTextToSize,
    html: mockHtml,
  }));
});
