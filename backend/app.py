from flask import Flask, jsonify
from flask_cors import CORS
from routes.auth_routes import auth_bp
from routes.detection_routes import detection_bp
from routes.alert_routes import alert_bp
from utils.config import Config

def create_app():
    """
    Factory function to create the Flask application.
    Enables CORS and registers all blueprints.
    """
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for frontend integration
    CORS(app)

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(detection_bp, url_prefix='/detect')
    app.register_blueprint(alert_bp, url_prefix='/alerts')

    @app.route('/')
    def index():
        return jsonify({
            'name': 'Smart AI Helmet & Bike Safety API',
            'version': '1.0.0',
            'status': 'API Running'
        })

    return app

if __name__ == '__main__':
    app = create_app()
    # use_reloader=False fixes Windows OSError: [WinError 10038] socket crash
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False, threaded=True)
