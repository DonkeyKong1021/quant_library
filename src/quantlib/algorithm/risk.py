"""Risk Management Models - Apply risk controls and constraints"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from quantlib.algorithm.alpha import Insight


class RiskManagementModel(ABC):
    """Base class for risk management models"""
    
    @abstractmethod
    def manage_risk(self, context: Any, targets: Dict[str, float]) -> Dict[str, float]:
        """
        Apply risk management to portfolio targets.
        
        Args:
            context: Algorithm context
            targets: Dictionary of symbol -> target weight
            
        Returns:
            Modified targets dictionary after risk management
        """
        pass


class MaximumDrawdownPercent(RiskManagementModel):
    """Risk management based on maximum drawdown"""
    
    def __init__(self, max_drawdown_pct: float = 0.20):
        """
        Initialize maximum drawdown risk model.
        
        Args:
            max_drawdown_pct: Maximum allowed drawdown (0.20 = 20%)
        """
        self.max_drawdown_pct = max_drawdown_pct
        self.peak_equity = None
    
    def manage_risk(self, context: Any, targets: Dict[str, float]) -> Dict[str, float]:
        """
        Reduce positions if drawdown exceeds threshold.
        
        Args:
            context: Algorithm context
            targets: Target weights
            
        Returns:
            Modified targets
        """
        portfolio = context.portfolio
        current_prices = getattr(context, 'current_prices', {})
        
        if not current_prices:
            return targets
        
        current_equity = portfolio.get_total_equity(current_prices)
        
        # Track peak equity
        if self.peak_equity is None or current_equity > self.peak_equity:
            self.peak_equity = current_equity
        
        # Calculate current drawdown
        if self.peak_equity > 0:
            drawdown_pct = (self.peak_equity - current_equity) / self.peak_equity
        else:
            drawdown_pct = 0.0
        
        # If drawdown exceeds threshold, reduce all positions
        if drawdown_pct > self.max_drawdown_pct:
            # Scale down all targets proportionally
            scale_factor = max(0.0, 1.0 - (drawdown_pct - self.max_drawdown_pct) / self.max_drawdown_pct)
            return {symbol: weight * scale_factor for symbol, weight in targets.items()}
        
        return targets


class MaximumLeverage(RiskManagementModel):
    """Risk management based on maximum leverage"""
    
    def __init__(self, max_leverage: float = 1.0):
        """
        Initialize maximum leverage risk model.
        
        Args:
            max_leverage: Maximum allowed leverage (1.0 = no leverage)
        """
        self.max_leverage = max_leverage
    
    def manage_risk(self, context: Any, targets: Dict[str, float]) -> Dict[str, float]:
        """
        Scale down positions if total leverage exceeds threshold.
        
        Args:
            context: Algorithm context
            targets: Target weights
            
        Returns:
            Modified targets
        """
        # Calculate total absolute weight (leverage)
        total_weight = sum(abs(w) for w in targets.values())
        
        if total_weight > self.max_leverage:
            # Scale down proportionally
            scale_factor = self.max_leverage / total_weight
            return {symbol: weight * scale_factor for symbol, weight in targets.items()}
        
        return targets


class StopLossModel(RiskManagementModel):
    """Risk management with stop-loss per position"""
    
    def __init__(self, stop_loss_pct: float = 0.05):
        """
        Initialize stop-loss model.
        
        Args:
            stop_loss_pct: Stop loss percentage (0.05 = 5%)
        """
        self.stop_loss_pct = stop_loss_pct
        self.entry_prices = {}  # Track entry prices for positions
    
    def manage_risk(self, context: Any, targets: Dict[str, float]) -> Dict[str, float]:
        """
        Exit positions that have hit stop-loss.
        
        Args:
            context: Algorithm context
            targets: Target weights
            
        Returns:
            Modified targets (positions with stop-loss hit are set to 0)
        """
        portfolio = context.portfolio
        current_prices = getattr(context, 'current_prices', {})
        current_positions = portfolio.get_positions()
        
        modified_targets = targets.copy()
        
        for symbol, target_weight in targets.items():
            if symbol not in current_prices:
                continue
            
            current_price = current_prices[symbol]
            current_shares = current_positions.get(symbol, 0)
            
            # Only apply stop-loss to existing positions
            if current_shares == 0:
                # Track entry price for new positions
                if target_weight != 0:
                    self.entry_prices[symbol] = current_price
                continue
            
            # Get entry price
            entry_price = self.entry_prices.get(symbol, current_price)
            
            # Calculate loss
            if current_shares > 0:  # Long position
                loss_pct = (entry_price - current_price) / entry_price
            else:  # Short position
                loss_pct = (current_price - entry_price) / entry_price
            
            # If stop-loss hit, exit position
            if loss_pct >= self.stop_loss_pct:
                modified_targets[symbol] = 0.0
                if symbol in self.entry_prices:
                    del self.entry_prices[symbol]
            else:
                # Update entry price if still holding
                if target_weight != 0:
                    self.entry_prices[symbol] = entry_price
        
        return modified_targets
