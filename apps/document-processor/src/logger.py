"""
Centralized logging configuration for the document processor service.
Provides structured logging with appropriate log levels and formatting.
"""

import os
import sys
import logging
from typing import Optional


def setup_logger(
    name: str,
    level: Optional[int] = None
) -> logging.Logger:
    """
    Configure and return a logger instance with consistent formatting.
    
    Args:
        name: Name of the logger (typically __name__ of the calling module)
        level: Optional logging level (defaults to INFO in dev, WARNING in prod)
    
    Returns:
        Configured logger instance
    """
    if level is None:
        # Use WARNING level in production, INFO in development
        is_dev = os.getenv("ENVIRONMENT", "production") == "development"
        level = logging.DEBUG if is_dev else logging.WARNING
    
    logger = logging.getLogger(name)
    
    # Only configure if not already configured
    if not logger.handlers:
        logger.setLevel(level)
        
        # Prevent propagation to root logger to avoid duplicate logs
        logger.propagate = False
        
        # Create console handler with formatting
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)
        
        # Create formatter with timestamp, level, module name, and message
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        
        logger.addHandler(handler)
    
    return logger
