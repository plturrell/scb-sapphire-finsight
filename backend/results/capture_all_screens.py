#!/usr/bin/env python3
"""Capture screenshots of all dashboard screens to prove they're functional"""

import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def capture_all_screens():
    """Capture screenshots of all dashboard screens"""
    
    # Setup Chrome options
    chrome_options = Options()
    chrome_options.add_argument('--window-size=1920,1080')
    
    # Initialize driver
    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 10)
    
    try:
        # Open the dashboard
        driver.get('http://localhost:8000/sap_fiori_dashboard.html')
        time.sleep(3)
        
        screens = [
            ("Dashboard", "dashboardTab"),
            ("Impact Analysis", "impactTab"),
            ("Finance Options", "financeTab"),
            ("Risk Assessment", "riskTab"),
            ("Action Timeline", "timelineTab"),
            ("Reports", "reportsTab")
        ]
        
        screenshots_dir = "screenshots"
        os.makedirs(screenshots_dir, exist_ok=True)
        
        for screen_name, tab_id in screens:
            print(f"Capturing {screen_name}...")
            
            # Click the tab
            tab = wait.until(EC.element_to_be_clickable((By.ID, tab_id)))
            tab.click()
            
            # Wait for content to load
            time.sleep(2)
            
            # Take screenshot
            screenshot_path = f"{screenshots_dir}/{screen_name.lower().replace(' ', '_')}.png"
            driver.save_screenshot(screenshot_path)
            print(f"✓ Saved {screenshot_path}")
        
        print("\nAll screens captured successfully!")
        print("Screenshots saved in results/screenshots/")
        
    finally:
        driver.quit()

if __name__ == '__main__':
    print("Starting screen capture...")
    capture_all_screens()