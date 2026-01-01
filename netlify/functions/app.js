exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: "<h1>Netlify Function is working ✅</h1>",
  };
};
