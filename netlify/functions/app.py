def handler(event, context):
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "text/html"},
        "body": "<h1>Flask app placeholder</h1><p>Netlify Function is working.</p>",
    }
