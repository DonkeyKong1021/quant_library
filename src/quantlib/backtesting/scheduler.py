"""Scheduled events system for time-based function execution"""

from typing import Callable, Dict, List, Optional, Set
from datetime import datetime, time
from enum import Enum
import pandas as pd


class TimeRule(Enum):
    """Time rules for scheduling"""
    EVERY_MINUTE = "every_minute"
    EVERY_5_MINUTES = "every_5_minutes"
    EVERY_15_MINUTES = "every_15_minutes"
    EVERY_30_MINUTES = "every_30_minutes"
    EVERY_HOUR = "every_hour"
    EVERY_DAY = "every_day"
    EVERY_WEEK = "every_week"
    EVERY_MONTH = "every_month"
    MARKET_OPEN = "market_open"  # Typically 9:30 AM ET
    MARKET_CLOSE = "market_close"  # Typically 4:00 PM ET


class ScheduledEvent:
    """Represents a scheduled function call"""
    
    def __init__(
        self,
        time_rule: TimeRule,
        callback: Callable,
        time_of_day: Optional[time] = None,
        day_of_week: Optional[int] = None,  # 0=Monday, 6=Sunday
        day_of_month: Optional[int] = None
    ):
        """
        Initialize scheduled event.
        
        Args:
            time_rule: When to trigger (TimeRule enum)
            callback: Function to call (will receive context as argument)
            time_of_day: Specific time of day (for daily/weekly/monthly rules)
            day_of_week: Day of week (0=Monday, 6=Sunday, for weekly rules)
            day_of_month: Day of month (1-31, for monthly rules)
        """
        self.time_rule = time_rule
        self.callback = callback
        self.time_of_day = time_of_day
        self.day_of_week = day_of_week
        self.day_of_month = day_of_month
        self.last_executed: Optional[datetime] = None
    
    def should_execute(self, current_time: datetime) -> bool:
        """Check if this event should execute at the given time"""
        current_date = current_time.date()
        current_time_only = current_time.time()
        
        if self.time_rule == TimeRule.EVERY_MINUTE:
            return True  # Execute every bar
        elif self.time_rule == TimeRule.EVERY_5_MINUTES:
            return current_time.minute % 5 == 0
        elif self.time_rule == TimeRule.EVERY_15_MINUTES:
            return current_time.minute % 15 == 0
        elif self.time_rule == TimeRule.EVERY_30_MINUTES:
            return current_time.minute % 30 == 0
        elif self.time_rule == TimeRule.EVERY_HOUR:
            return current_time.minute == 0
        elif self.time_rule == TimeRule.EVERY_DAY:
            if self.time_of_day:
                # Check if we're at the specified time
                return (current_time_only.hour == self.time_of_day.hour and
                       current_time_only.minute == self.time_of_day.minute)
            else:
                # Execute once per day (at market open by default)
                return current_time_only.hour == 9 and current_time_only.minute == 30
        elif self.time_rule == TimeRule.EVERY_WEEK:
            if self.day_of_week is not None:
                return (current_time.weekday() == self.day_of_week and
                       (not self.time_of_day or 
                        (current_time_only.hour == self.time_of_day.hour and
                         current_time_only.minute == self.time_of_day.minute)))
            else:
                # Default to Monday
                return current_time.weekday() == 0
        elif self.time_rule == TimeRule.EVERY_MONTH:
            if self.day_of_month is not None:
                return (current_time.day == self.day_of_month and
                       (not self.time_of_day or
                        (current_time_only.hour == self.time_of_day.hour and
                         current_time_only.minute == self.time_of_day.minute)))
            else:
                # Default to first day of month
                return current_time.day == 1
        elif self.time_rule == TimeRule.MARKET_OPEN:
            # 9:30 AM (assuming ET timezone)
            return current_time_only.hour == 9 and current_time_only.minute == 30
        elif self.time_rule == TimeRule.MARKET_CLOSE:
            # 4:00 PM (assuming ET timezone)
            return current_time_only.hour == 16 and current_time_only.minute == 0
        
        return False
    
    def execute(self, context: any) -> None:
        """Execute the scheduled callback"""
        try:
            self.callback(context)
            self.last_executed = context.current_time if hasattr(context, 'current_time') else datetime.now()
        except Exception as e:
            # Log error but don't crash the backtest
            print(f"Error executing scheduled event: {e}")


class Scheduler:
    """Manages scheduled events for algorithms"""
    
    def __init__(self):
        """Initialize scheduler"""
        self.events: List[ScheduledEvent] = []
    
    def schedule(
        self,
        time_rule: TimeRule,
        callback: Callable,
        time_of_day: Optional[time] = None,
        day_of_week: Optional[int] = None,
        day_of_month: Optional[int] = None
    ) -> ScheduledEvent:
        """
        Schedule a function to be called at regular intervals.
        
        Args:
            time_rule: When to trigger (TimeRule enum)
            callback: Function to call (will receive context as argument)
            time_of_day: Specific time of day (for daily/weekly/monthly rules)
            day_of_week: Day of week (0=Monday, 6=Sunday)
            day_of_month: Day of month (1-31)
            
        Returns:
            ScheduledEvent object
        """
        event = ScheduledEvent(time_rule, callback, time_of_day, day_of_week, day_of_month)
        self.events.append(event)
        return event
    
    def check_and_execute(self, context: any) -> None:
        """
        Check all scheduled events and execute those that should run.
        
        Args:
            context: Algorithm context object
        """
        if not hasattr(context, 'current_time'):
            return
        
        current_time = context.current_time
        
        for event in self.events:
            if event.should_execute(current_time):
                # Check if we've already executed this event for this timestamp
                # (prevent multiple executions in the same bar)
                if event.last_executed is None or event.last_executed < current_time:
                    event.execute(context)
    
    def clear(self):
        """Clear all scheduled events"""
        self.events.clear()


# Convenience functions for common scheduling patterns
def every_day(callback: Callable, time_of_day: Optional[time] = None) -> ScheduledEvent:
    """Schedule a function to run every day"""
    scheduler = get_default_scheduler()
    return scheduler.schedule(TimeRule.EVERY_DAY, callback, time_of_day=time_of_day)


def every_week(callback: Callable, day_of_week: int = 0, time_of_day: Optional[time] = None) -> ScheduledEvent:
    """Schedule a function to run every week"""
    scheduler = get_default_scheduler()
    return scheduler.schedule(TimeRule.EVERY_WEEK, callback, day_of_week=day_of_week, time_of_day=time_of_day)


def every_month(callback: Callable, day_of_month: int = 1, time_of_day: Optional[time] = None) -> ScheduledEvent:
    """Schedule a function to run every month"""
    scheduler = get_default_scheduler()
    return scheduler.schedule(TimeRule.EVERY_MONTH, callback, day_of_month=day_of_month, time_of_day=time_of_day)


def market_open(callback: Callable) -> ScheduledEvent:
    """Schedule a function to run at market open"""
    scheduler = get_default_scheduler()
    return scheduler.schedule(TimeRule.MARKET_OPEN, callback)


def market_close(callback: Callable) -> ScheduledEvent:
    """Schedule a function to run at market close"""
    scheduler = get_default_scheduler()
    return scheduler.schedule(TimeRule.MARKET_CLOSE, callback)


# Global scheduler instance (for convenience functions)
_default_scheduler: Optional[Scheduler] = None


def get_default_scheduler() -> Scheduler:
    """Get or create the default scheduler instance"""
    global _default_scheduler
    if _default_scheduler is None:
        _default_scheduler = Scheduler()
    return _default_scheduler
