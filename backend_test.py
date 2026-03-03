#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime, timezone
import uuid

class ParkSmartAPITester:
    def __init__(self, base_url="https://park-book.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_parking_id = None
        self.test_booking_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            print(f"   Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - {name}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        return success

    def test_seed_data(self):
        """Test data seeding"""
        success, response = self.run_test(
            "Seed Data",
            "POST", 
            "seed-data",
            200
        )
        if success:
            print(f"   Seeded sites: {response.get('sites', 'unknown')}")
        return success

    def test_get_parking_sites(self):
        """Test getting parking sites"""
        success, response = self.run_test(
            "Get Parking Sites",
            "GET",
            "parking-sites", 
            200
        )
        if success:
            sites_count = len(response)
            print(f"   Found {sites_count} parking sites")
            if sites_count >= 100:
                print(f"✅ Expected 100+ sites, got {sites_count}")
                # Store first site for testing
                if response and len(response) > 0:
                    self.test_parking_id = response[0]['id']
                    print(f"   Using test parking ID: {self.test_parking_id}")
            else:
                print(f"❌ Expected 100+ sites, only got {sites_count}")
                return False
        return success

    def test_get_parking_slots(self):
        """Test getting parking slots for a site"""
        if not self.test_parking_id:
            print("❌ No test parking ID available")
            return False
            
        success, response = self.run_test(
            "Get Parking Slots",
            "GET",
            f"parking-slots/{self.test_parking_id}",
            200
        )
        if success:
            slots_count = len(response)
            print(f"   Found {slots_count} slots for parking {self.test_parking_id}")
            if slots_count > 0:
                available_slots = [s for s in response if not s.get('occupied', True)]
                occupied_slots = [s for s in response if s.get('occupied', False)]
                print(f"   Available: {len(available_slots)}, Occupied: {len(occupied_slots)}")
        return success

    def test_create_booking(self):
        """Test creating a booking"""
        if not self.test_parking_id:
            print("❌ No test parking ID available")
            return False

        # First get slots to find an available one
        _, slots_response = self.run_test(
            "Get Slots for Booking",
            "GET", 
            f"parking-slots/{self.test_parking_id}",
            200
        )
        
        available_slots = [s for s in slots_response if not s.get('occupied', True)]
        if not available_slots:
            print("❌ No available slots for booking test")
            return False

        test_slot = available_slots[0]
        booking_data = {
            "parkingId": self.test_parking_id,
            "parkingName": "Test Parking",
            "slotId": test_slot['slotId'],
            "duration": 2,
            "pricePerHour": 50,
            "totalPrice": 100,
            "status": "active",
            "address": "Test Address, Mumbai",
            "bookingType": "now"
        }

        success, response = self.run_test(
            "Create Booking",
            "POST",
            "bookings",
            200,
            data=booking_data
        )
        if success:
            self.test_booking_id = response.get('id')
            print(f"   Created booking ID: {self.test_booking_id}")
            print(f"   Booked slot: {response.get('slotId')}")
        return success

    def test_create_scheduled_booking(self):
        """Test creating a scheduled booking"""
        if not self.test_parking_id:
            print("❌ No test parking ID available")
            return False

        # Get available slots
        _, slots_response = self.run_test(
            "Get Slots for Scheduled Booking", 
            "GET",
            f"parking-slots/{self.test_parking_id}",
            200
        )
        
        available_slots = [s for s in slots_response if not s.get('occupied', True)]
        if len(available_slots) < 2:
            print("❌ Need at least 2 available slots for scheduled booking test")
            return False

        test_slot = available_slots[1]  # Use different slot
        future_time = datetime.now(timezone.utc).replace(hour=15, minute=0, second=0, microsecond=0)
        
        booking_data = {
            "parkingId": self.test_parking_id,
            "parkingName": "Test Parking Scheduled",
            "slotId": test_slot['slotId'], 
            "duration": 3,
            "pricePerHour": 60,
            "totalPrice": 180,
            "status": "scheduled",
            "address": "Test Address, Mumbai",
            "bookingType": "later",
            "scheduledTime": future_time.isoformat()
        }

        success, response = self.run_test(
            "Create Scheduled Booking",
            "POST",
            "bookings", 
            200,
            data=booking_data
        )
        if success:
            print(f"   Created scheduled booking ID: {response.get('id')}")
            print(f"   Scheduled for: {response.get('scheduledTime')}")
        return success

    def test_get_bookings(self):
        """Test getting all bookings"""
        success, response = self.run_test(
            "Get All Bookings",
            "GET",
            "bookings",
            200
        )
        if success:
            bookings_count = len(response)
            print(f"   Found {bookings_count} total bookings")
            
            # Check booking statuses
            active_bookings = [b for b in response if b.get('status') == 'active']
            scheduled_bookings = [b for b in response if b.get('status') == 'scheduled']
            print(f"   Active: {len(active_bookings)}, Scheduled: {len(scheduled_bookings)}")
            
            # Check booking types
            now_bookings = [b for b in response if b.get('bookingType') == 'now']
            later_bookings = [b for b in response if b.get('bookingType') == 'later']
            print(f"   Book Now: {len(now_bookings)}, Book Later: {len(later_bookings)}")
        return success

    def test_esp32_simulation(self):
        """Test ESP32 simulation for real-time updates"""
        success, response = self.run_test(
            "ESP32 Simulation",
            "POST",
            "simulate-esp32",
            200
        )
        if success:
            print(f"   Updated slot: {response.get('slot')}")
            print(f"   New occupied status: {response.get('occupied')}")
        return success

    def run_all_tests(self):
        """Run complete API test suite"""
        print("🚀 Starting ParkSmart Backend API Testing")
        print("=" * 50)
        
        # Test sequence
        tests = [
            ("API Root", self.test_api_root),
            ("Data Seeding", self.test_seed_data), 
            ("Get Parking Sites", self.test_get_parking_sites),
            ("Get Parking Slots", self.test_get_parking_slots),
            ("Create Active Booking", self.test_create_booking),
            ("Create Scheduled Booking", self.test_create_scheduled_booking),
            ("Get All Bookings", self.test_get_bookings),
            ("ESP32 Simulation", self.test_esp32_simulation),
        ]

        print(f"\nRunning {len(tests)} test categories...")
        
        for test_name, test_func in tests:
            try:
                test_func()
                time.sleep(0.5)  # Brief pause between tests
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                
        # Final results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Backend API is working correctly.")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed.")
            return False

def main():
    tester = ParkSmartAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())