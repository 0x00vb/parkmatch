/**
 * Availability Schedule Validation Tests
 *
 * This file contains tests to verify that the reservation system
 * properly validates time slots against garage availability schedules.
 *
 * Run with: npx tsx lib/availability-validation.test.ts
 */

import { prisma } from './prisma';
import { checkGarageScheduleAvailability } from './reservations';

// Test configuration
const TEST_CONFIG = {
  TEST_TIMEOUT: 30000, // 30 seconds
};

// Test data - using real IDs from database
const TEST_GARAGE_WITH_AVAILABILITY = 'cmhseofes0007dfreaof25qiz'; // Garage owned by Juan carlos - assuming it has availability schedules

// Helper function to create test dates for different days
const createTestDate = (dayOfWeek: number, hour: number, minute: number = 0): Date => {
  // Create a date for the specified day of week (0=Sunday, 1=Monday, etc.)
  const now = new Date();
  const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntilTarget);
  targetDate.setHours(hour, minute, 0, 0);

  // If the target date is in the past, add a week
  if (targetDate <= now) {
    targetDate.setDate(targetDate.getDate() + 7);
  }

  return targetDate;
};

/**
 * Test garage with no availability schedules configured
 */
async function testGarageWithoutAvailability(): Promise<boolean> {
  console.log('\n🧪 Testing garage without availability schedules...');

  try {
    // Create a test garage that doesn't exist or has no availability schedules
    const fakeGarageId = 'nonexistent-garage-id';
    const startTime = createTestDate(1, 9, 0); // Monday 9:00 AM
    const endTime = createTestDate(1, 10, 0); // Monday 10:00 AM

    const result = await checkGarageScheduleAvailability(fakeGarageId, startTime, endTime);

    if (!result.available && result.errors.some(error => error.includes('horarios de disponibilidad'))) {
      console.log('✅ Correctly rejected garage without availability schedules');
      return true;
    } else {
      console.error('❌ Should have rejected garage without availability schedules');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

/**
 * Test time slots within available hours
 */
async function testAvailableTimeSlots(): Promise<boolean> {
  console.log('\n🧪 Testing time slots within available hours...');

  try {
    // First, let's get the availability schedules for our test garage
    const schedules = await prisma.availabilitySchedule.findMany({
      where: {
        garageId: TEST_GARAGE_WITH_AVAILABILITY,
        isActive: true,
      },
    });

    if (schedules.length === 0) {
      console.log('⚠️ No availability schedules found for test garage, skipping test');
      return true; // Skip this test if no schedules exist
    }

    // Test each schedule
    let allPassed = true;

    for (const schedule of schedules) {
      // Create a time slot within this schedule
      const dayOfWeek = schedule.dayOfWeek;
      const startHour = parseInt(schedule.startTime.split(':')[0]);
      const startMinute = parseInt(schedule.startTime.split(':')[1]);
      const endHour = parseInt(schedule.endTime.split(':')[0]);

      const startTime = createTestDate(dayOfWeek, startHour, startMinute);
      const endTime = createTestDate(dayOfWeek, startHour + 1, startMinute); // 1 hour later

      const result = await checkGarageScheduleAvailability(TEST_GARAGE_WITH_AVAILABILITY, startTime, endTime);

      if (result.available) {
        console.log(`✅ Correctly accepted time slot within schedule: ${schedule.startTime} - ${schedule.endTime}`);
      } else {
        console.error(`❌ Incorrectly rejected time slot within schedule: ${schedule.startTime} - ${schedule.endTime}`);
        console.error('Errors:', result.errors);
        allPassed = false;
      }
    }

    return allPassed;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

/**
 * Test time slots outside available hours
 */
async function testUnavailableTimeSlots(): Promise<boolean> {
  console.log('\n🧪 Testing time slots outside available hours...');

  try {
    // First, let's get the availability schedules for our test garage
    const schedules = await prisma.availabilitySchedule.findMany({
      where: {
        garageId: TEST_GARAGE_WITH_AVAILABILITY,
        isActive: true,
      },
    });

    if (schedules.length === 0) {
      console.log('⚠️ No availability schedules found for test garage, creating test case');
      // Test with a day that likely has no availability
      const startTime = createTestDate(0, 2, 0); // Sunday 2:00 AM (likely not available)
      const endTime = createTestDate(0, 3, 0); // Sunday 3:00 AM

      const result = await checkGarageScheduleAvailability(TEST_GARAGE_WITH_AVAILABILITY, startTime, endTime);

      if (!result.available) {
        console.log('✅ Correctly rejected time slot for day without availability');
        return true;
      } else {
        console.error('❌ Incorrectly accepted time slot for day without availability');
        return false;
      }
    }

    // Test a time slot before the schedule starts
    const firstSchedule = schedules[0];
    const dayOfWeek = firstSchedule.dayOfWeek;
    const scheduleStartHour = parseInt(firstSchedule.startTime.split(':')[0]);

    const startTime = createTestDate(dayOfWeek, scheduleStartHour - 2, 0); // 2 hours before schedule starts
    const endTime = createTestDate(dayOfWeek, scheduleStartHour - 1, 0); // 1 hour before schedule starts

    const result = await checkGarageScheduleAvailability(TEST_GARAGE_WITH_AVAILABILITY, startTime, endTime);

    if (!result.available) {
      console.log(`✅ Correctly rejected time slot before schedule: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
      return true;
    } else {
      console.error(`❌ Incorrectly accepted time slot before schedule: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

/**
 * Test time slots that span multiple days
 */
async function testMultiDayTimeSlots(): Promise<boolean> {
  console.log('\n🧪 Testing multi-day time slots...');

  try {
    // Create a time slot that starts on one day and ends on another
    const startTime = createTestDate(1, 23, 0); // Monday 11:00 PM
    const endTime = createTestDate(2, 1, 0); // Tuesday 1:00 AM

    const result = await checkGarageScheduleAvailability(TEST_GARAGE_WITH_AVAILABILITY, startTime, endTime);

    // Multi-day slots should be rejected as they span different days with potentially different availability
    if (!result.available) {
      console.log('✅ Correctly rejected multi-day time slot');
      return true;
    } else {
      console.error('❌ Incorrectly accepted multi-day time slot');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests(): Promise<void> {
  console.log('🚀 Starting Availability Schedule Validation Tests\n');
  console.log('='.repeat(60));

  const testResults = {
    noAvailability: false,
    availableSlots: false,
    unavailableSlots: false,
    multiDaySlots: false,
  };

  try {
    testResults.noAvailability = await testGarageWithoutAvailability();
    testResults.availableSlots = await testAvailableTimeSlots();
    testResults.unavailableSlots = await testUnavailableTimeSlots();
    testResults.multiDaySlots = await testMultiDayTimeSlots();

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    // Results summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 Test Results Summary:');
    console.log(`   Garage without availability: ${testResults.noAvailability ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Available time slots: ${testResults.availableSlots ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Unavailable time slots: ${testResults.unavailableSlots ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Multi-day time slots: ${testResults.multiDaySlots ? '✅ PASS' : '❌ FAIL'}`);

    const totalPassed = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;

    console.log(`\n🎯 Overall: ${totalPassed}/${totalTests} tests passed`);

    if (totalPassed === totalTests) {
      console.log('🎉 All availability validation tests PASSED!');
      process.exit(0);
    } else {
      console.log('💥 Some tests FAILED. Please check the implementation.');
      process.exit(1);
    }
  }
}

// Handle timeout
const timeout = setTimeout(() => {
  console.error('❌ Test suite timed out');
  process.exit(1);
}, TEST_CONFIG.TEST_TIMEOUT);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  process.exit(1);
});

// Run tests
runTests().finally(() => {
  clearTimeout(timeout);
});
