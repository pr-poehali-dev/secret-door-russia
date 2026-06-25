import os

def handler(event: dict, context) -> dict:
    """Отдаёт публичный конфиг для фронтенда (ключ Яндекс Карт)."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': f'{{"yandexMapsKey": "{os.environ.get("YANDEX_MAPS_KEY", "")}"}}'
    }
