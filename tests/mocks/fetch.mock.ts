global.fetch = jest.fn();

export const mockJsonResponse = (data: any) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    headers: {
      get: () => "application/json",
    },
    json: async () => data,
  });
};

export const mockXmlResponse = (xml: string) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    headers: {
      get: () => "application/xml",
    },
    text: async () => xml,
  });
};

export const resetFetchMock = () => {
  (global.fetch as jest.Mock).mockReset();
};