"""Universe selection models for algorithm framework"""

from abc import ABC, abstractmethod
from typing import Dict, Set, List, Optional, Any
from datetime import datetime
import pandas as pd


class UniverseSelection(ABC):
    """Base class for universe selection models"""
    
    @abstractmethod
    def select(
        self,
        context: Any,
        current_time: datetime,
        data: Dict[str, pd.DataFrame]
    ) -> Set[str]:
        """
        Select securities for the universe.
        
        Args:
            context: Algorithm context
            current_time: Current timestamp
            data: Dictionary of symbol -> DataFrame
            
        Returns:
            Set of symbol strings
        """
        pass
    
    def on_securities_changed(
        self,
        context: Any,
        added: Set[str],
        removed: Set[str]
    ) -> None:
        """
        Called when securities are added or removed from universe.
        
        Args:
            context: Algorithm context
            added: Set of symbols added
            removed: Set of symbols removed
        """
        pass


class ManualUniverse(UniverseSelection):
    """Manually specified universe"""
    
    def __init__(self, symbols: List[str]):
        """
        Initialize manual universe.
        
        Args:
            symbols: List of symbols to include
        """
        self.symbols = [s.upper() for s in symbols]
    
    def select(
        self,
        context: Any,
        current_time: datetime,
        data: Dict[str, pd.DataFrame]
    ) -> Set[str]:
        """Return the manually specified symbols"""
        return set(self.symbols)


class CoarseUniverse(UniverseSelection):
    """Coarse universe filtering by basic criteria"""
    
    def __init__(
        self,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_volume: Optional[float] = None,
        max_count: Optional[int] = None
    ):
        """
        Initialize coarse universe.
        
        Args:
            min_price: Minimum price filter
            max_price: Maximum price filter
            min_volume: Minimum volume filter
            max_count: Maximum number of securities to return
        """
        self.min_price = min_price
        self.max_price = max_price
        self.min_volume = min_volume
        self.max_count = max_count
    
    def select(
        self,
        context: Any,
        current_time: datetime,
        data: Dict[str, pd.DataFrame]
    ) -> Set[str]:
        """Select symbols based on coarse filtering"""
        selected = set()
        
        for symbol, df in data.items():
            if df.empty:
                continue
            
            # Get latest bar
            latest = df.iloc[-1]
            price = latest.get('Close', 0)
            volume = latest.get('Volume', 0)
            
            # Apply filters
            if self.min_price and price < self.min_price:
                continue
            if self.max_price and price > self.max_price:
                continue
            if self.min_volume and volume < self.min_volume:
                continue
            
            selected.add(symbol)
        
        # Limit count if specified
        if self.max_count and len(selected) > self.max_count:
            # Sort by volume (descending) and take top N
            symbol_volumes = []
            for symbol in selected:
                df = data[symbol]
                if not df.empty:
                    volume = df.iloc[-1].get('Volume', 0)
                    symbol_volumes.append((symbol, volume))
            
            symbol_volumes.sort(key=lambda x: x[1], reverse=True)
            selected = set([s[0] for s in symbol_volumes[:self.max_count]])
        
        return selected


class FineUniverse(UniverseSelection):
    """Fine universe filtering with fundamental data"""
    
    def __init__(
        self,
        coarse_universe: Optional[UniverseSelection] = None,
        min_market_cap: Optional[float] = None,
        max_market_cap: Optional[float] = None,
        sectors: Optional[List[str]] = None,
        industries: Optional[List[str]] = None,
        exclude_sectors: Optional[List[str]] = None,
        exclude_industries: Optional[List[str]] = None,
        min_pe_ratio: Optional[float] = None,
        max_pe_ratio: Optional[float] = None
    ):
        """
        Initialize fine universe with fundamental filters.
        
        Args:
            coarse_universe: Coarse universe to apply fine filtering to (optional)
            min_market_cap: Minimum market capitalization
            max_market_cap: Maximum market capitalization
            sectors: Include only these sectors
            industries: Include only these industries
            exclude_sectors: Exclude these sectors
            exclude_industries: Exclude these industries
            min_pe_ratio: Minimum P/E ratio
            max_pe_ratio: Maximum P/E ratio
        """
        self.coarse_universe = coarse_universe or ManualUniverse([])
        self.min_market_cap = min_market_cap
        self.max_market_cap = max_market_cap
        self.sectors = [s.upper() for s in (sectors or [])]
        self.industries = [i.upper() for i in (industries or [])]
        self.exclude_sectors = [s.upper() for s in (exclude_sectors or [])]
        self.exclude_industries = [i.upper() for i in (exclude_industries or [])]
        self.min_pe_ratio = min_pe_ratio
        self.max_pe_ratio = max_pe_ratio
        
        # Store fundamental data (would be populated from data source)
        self.fundamental_data: Dict[str, Dict] = {}
    
    def set_fundamental_data(self, symbol: str, data: Dict) -> None:
        """Set fundamental data for a symbol"""
        self.fundamental_data[symbol.upper()] = data
    
    def select(
        self,
        context: Any,
        current_time: datetime,
        data: Dict[str, pd.DataFrame]
    ) -> Set[str]:
        """Select symbols based on fine filtering"""
        # Start with coarse universe
        coarse_symbols = self.coarse_universe.select(context, current_time, data)
        
        selected = set()
        
        for symbol in coarse_symbols:
            fund_data = self.fundamental_data.get(symbol, {})
            
            # Market cap filter
            market_cap = fund_data.get('market_cap')
            if market_cap:
                if self.min_market_cap and market_cap < self.min_market_cap:
                    continue
                if self.max_market_cap and market_cap > self.max_market_cap:
                    continue
            
            # Sector filter
            sector = fund_data.get('sector', '').upper()
            if self.sectors and sector not in self.sectors:
                continue
            if self.exclude_sectors and sector in self.exclude_sectors:
                continue
            
            # Industry filter
            industry = fund_data.get('industry', '').upper()
            if self.industries and industry not in self.industries:
                continue
            if self.exclude_industries and industry in self.exclude_industries:
                continue
            
            # P/E ratio filter
            pe_ratio = fund_data.get('pe_ratio')
            if pe_ratio:
                if self.min_pe_ratio and pe_ratio < self.min_pe_ratio:
                    continue
                if self.max_pe_ratio and pe_ratio > self.max_pe_ratio:
                    continue
            
            selected.add(symbol)
        
        return selected
