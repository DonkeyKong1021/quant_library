"""Data fetcher component for fetching and displaying market data"""

import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
from quantlib.data import DataStore
from quantlib.data.fetcher_registry import get_registry
from quantlib.data.config import get_available_sources, get_default_data_source
from streamlit_app.utils.streamlit_helpers import (
    get_database_symbols,
    get_symbol_metadata,
    load_tickers_json,
    get_all_tickers_list,
    display_data_preview,
    check_database_connection
)
import pandas as pd


def data_fetcher_component(embed_in_layout=False, modal=False):
    """
    Data fetcher component with symbol selection, date range input, and data preview.
    
    Args:
        embed_in_layout: If True, component doesn't create its own layout (for embedding in other layouts)
        modal: If True, render as a modal-style expander (only works with embed_in_layout=True)
    
    Returns:
        pd.DataFrame: Fetched data or None
    """
    # Check database connection
    db_connected, _ = check_database_connection()
    
    if modal and embed_in_layout:
        # Modal mode: Show button to open/close, and render controls in expander
        return _render_modal_data_fetcher(db_connected)
    elif embed_in_layout:
        # When embedded, just render the controls without creating columns
        return _render_data_fetcher_controls(db_connected, compact=True)
    else:
        # Standalone mode: Two-column layout: Setup on left, Results on right
        col_left, col_right = st.columns([1.2, 1], gap="large")
        
        with col_left:
            data = _render_data_fetcher_controls(db_connected, compact=False)
        
        with col_right:
            st.markdown("### 📊 Results")
            if st.session_state.data is not None:
                data = st.session_state.data
                current_symbol = st.session_state.selected_symbol
                symbol = st.session_state.selected_symbol or ""
                if symbol and symbol.upper() == current_symbol:
                    display_data_preview(data)
                else:
                    st.info("👆 Configure and fetch data to see results")
            else:
                st.info("👆 Configure and fetch data to see results")
                data = None
        
        return st.session_state.data if st.session_state.data is not None else None


def _render_quick_search(db_connected):
    """Quick search interface - simple search bar with selectbox"""
    all_symbols_dict = _get_all_symbols_with_sources(db_connected)
    all_symbols = sorted(all_symbols_dict.keys())
    
    # Search input
    search_key = "quick_search_modal"
    search_term = st.text_input(
        "🔍 Quick Search",
        placeholder="Type symbol to search...",
        key=search_key
    )
    
    # Filter symbols based on search
    if search_term:
        filtered = [s for s in all_symbols if search_term.upper() in s]
    else:
        # Show common symbols and recent symbols first
        common = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "SPY"]
        recent = st.session_state.recent_symbols[:5] if st.session_state.recent_symbols else []
        filtered = list(dict.fromkeys(recent + [s for s in common if s in all_symbols] + all_symbols[:20]))
    
    if filtered:
        current_symbol = st.session_state.selected_symbol or (filtered[0] if filtered else "")
        try:
            current_index = filtered.index(current_symbol) if current_symbol in filtered else 0
        except ValueError:
            current_index = 0
        
        selected = st.selectbox(
            "Select Symbol",
            options=filtered,
            index=current_index,
            key="quick_search_select",
            label_visibility="collapsed"
        )
        return selected
    else:
        st.info("No symbols found")
        return st.session_state.selected_symbol or None


def _render_comprehensive_browse(db_connected):
    """Comprehensive database browser - full grid view with filters"""
    # Initialize session state for filter
    if 'browse_filter_type' not in st.session_state:
        st.session_state.browse_filter_type = 'All'
    if 'browse_search_term' not in st.session_state:
        st.session_state.browse_search_term = ''
    if 'browse_sector_filter' not in st.session_state:
        st.session_state.browse_sector_filter = 'All'
    
    # Get all symbols with metadata
    all_symbols_dict = _get_all_symbols_with_sources(db_connected)
    
    # Get sectors for dropdown
    tickers_data = load_tickers_json()
    sectors_list = list(tickers_data.keys()) if tickers_data else []
    
    # Organized filter section: Source filters on row 1
    st.markdown("**Source Filter**")
    filter_cols = st.columns(4, gap="small")
    with filter_cols[0]:
        filter_all_type = "primary" if st.session_state.browse_filter_type == 'All' else "secondary"
        if st.button("All", key="browse_filter_all", use_container_width=True, type=filter_all_type):
            st.session_state.browse_filter_type = 'All'
            st.rerun()
    
    with filter_cols[1]:
        recent_count = len(st.session_state.recent_symbols) if st.session_state.recent_symbols else 0
        filter_recent_type = "primary" if st.session_state.browse_filter_type == 'Recent' else "secondary"
        if st.button(f"Recent ({recent_count})", key="browse_filter_recent", use_container_width=True, type=filter_recent_type):
            st.session_state.browse_filter_type = 'Recent'
            st.rerun()
    
    with filter_cols[2]:
        filter_db_type = "primary" if st.session_state.browse_filter_type == 'Database' else "secondary"
        if st.button("Database", key="browse_filter_db", use_container_width=True, type=filter_db_type):
            st.session_state.browse_filter_type = 'Database'
            st.rerun()
    
    with filter_cols[3]:
        filter_tickers_type = "primary" if st.session_state.browse_filter_type == 'Tickers' else "secondary"
        if st.button("Tickers", key="browse_filter_tickers", use_container_width=True, type=filter_tickers_type):
            st.session_state.browse_filter_type = 'Tickers'
            st.rerun()
    
    # Row 2: Sector and Search filters side by side
    search_filter_cols = st.columns([1, 2], gap="small")
    with search_filter_cols[0]:
        if sectors_list:
            sectors_options = ["All"] + sectors_list
            sector_idx = sectors_options.index(st.session_state.browse_sector_filter) if st.session_state.browse_sector_filter in sectors_options else 0
            selected_sector = st.selectbox("Sector", sectors_options, index=sector_idx, key="browse_sector_filter")
            if selected_sector != st.session_state.browse_sector_filter:
                st.session_state.browse_sector_filter = selected_sector
                st.rerun()
    
    with search_filter_cols[1]:
        browse_search_key = "browse_search_modal"
        browse_search_term = st.text_input(
            "🔍 Filter Symbols",
            value=st.session_state.browse_search_term,
            placeholder="Type to filter symbols...",
            key=browse_search_key
        )
        st.session_state.browse_search_term = browse_search_term
    
    # Visual separation before symbol grid
    st.markdown("---")
    
    # Filter symbols based on search, filter type, and sector
    filtered_symbols = []
    for sym, metadata in sorted(all_symbols_dict.items()):
        # Apply source filter
        if st.session_state.browse_filter_type == 'Recent':
            if sym not in st.session_state.recent_symbols:
                continue
        elif st.session_state.browse_filter_type == 'Database':
            if metadata['source'] != 'DB':
                continue
        elif st.session_state.browse_filter_type == 'Tickers':
            if metadata['source'] != 'Ticker':
                continue
        
        # Apply sector filter
        if st.session_state.browse_sector_filter != 'All' and metadata['sector'] != st.session_state.browse_sector_filter:
            continue
        
        # Apply search filter
        if browse_search_term and browse_search_term.upper() not in sym:
            continue
        
        filtered_symbols.append((sym, metadata))
    
    # Display symbol grid (6 columns) with results count
    symbol = None
    if filtered_symbols:
        st.markdown(f"**{len(filtered_symbols)} symbols found**")
        st.markdown("")  # Small spacing
        
        num_cols = 6
        num_rows = (len(filtered_symbols) + num_cols - 1) // num_cols
        
        grid_key_prefix = "browse_grid_modal"
        for row in range(num_rows):
            cols = st.columns(num_cols, gap="small")
            for col_idx in range(num_cols):
                sym_idx = row * num_cols + col_idx
                if sym_idx < len(filtered_symbols):
                    sym, metadata = filtered_symbols[sym_idx]
                    with cols[col_idx]:
                        source_badge = {
                            'DB': '🗄️',
                            'Ticker': '📋',
                            'Common': '⭐'
                        }.get(metadata['source'], '')
                        
                        button_label = f"{source_badge} {sym}" if source_badge else sym
                        if st.button(
                            button_label,
                            key=f"{grid_key_prefix}_{sym}_{sym_idx}",
                            use_container_width=True,
                            help=f"Source: {metadata['source']}" + (f", Sector: {metadata['sector']}" if metadata['sector'] else "")
                        ):
                            symbol = sym
                            st.session_state.selected_symbol = symbol
                            # Add to recent symbols
                            if symbol not in st.session_state.recent_symbols:
                                st.session_state.recent_symbols.insert(0, symbol)
                                st.session_state.recent_symbols = st.session_state.recent_symbols[:10]
                            st.rerun()
    else:
        if browse_search_term:
            st.info(f"No symbols found matching '{browse_search_term}'")
        elif st.session_state.browse_filter_type == 'Recent' and not st.session_state.recent_symbols:
            st.info("No recent symbols. Select a symbol to add it to recent.")
        elif st.session_state.browse_filter_type == 'Database' and db_connected:
            db_symbols = get_database_symbols()
            if not db_symbols:
                st.info("No symbols in database. Use manual fetcher script to add data.")
        else:
            st.info("No symbols available")
    
    return symbol if symbol else st.session_state.selected_symbol


def _render_quick_fetch_bar(db_connected):
    """Render quick fetch bar with search, date inputs, and fetch button"""
    all_symbols_dict = _get_all_symbols_with_sources(db_connected)
    all_symbols = sorted(all_symbols_dict.keys())
    
    # Get common and recent symbols for default list
    common = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "SPY"]
    recent = st.session_state.recent_symbols[:5] if st.session_state.recent_symbols else []
    default_options = list(dict.fromkeys(recent + [s for s in common if s in all_symbols] + all_symbols[:30]))
    
    # 3 columns, 2 rows layout - perfectly symmetric
    col1, col2, col3 = st.columns([2, 2, 2], gap="medium")
    
    # Column 1: Symbol Search and Dropdown (Row 1 and Row 2)
    with col1:
        search_term = st.text_input(
            "🔍 Symbol Search",
            placeholder="Type symbol (e.g., AAPL)...",
            key="quick_fetch_search"
        )
        
        # Filter symbols based on search
        if search_term:
            filtered = [s for s in all_symbols if search_term.upper() in s]
        else:
            filtered = default_options
        
        if filtered:
            current_symbol = st.session_state.selected_symbol or (filtered[0] if filtered else "")
            try:
                current_index = filtered.index(current_symbol) if current_symbol in filtered else 0
            except ValueError:
                current_index = 0
            
            selected_symbol = st.selectbox(
                "Select Symbol",
                options=filtered,
                index=current_index,
                key="quick_fetch_select"
            )
            
            # Display current symbol with Cache and Max buttons on the same row
            col_symbol_display, col_cache, col_max = st.columns([2, 1, 1], gap="small")
            with col_symbol_display:
                st.markdown(f"**Symbol:** `{selected_symbol}`")
            with col_cache:
                st.markdown("<br>", unsafe_allow_html=True)  # Align with symbol text
                st.checkbox("Cache", value=True, key="quick_fetch_cache", help="Use cached data if available")
            with col_max:
                st.markdown("<br>", unsafe_allow_html=True)  # Align with symbol text
                if st.button("Max", key="quick_fetch_max_btn", use_container_width=True, 
                            help="Set to maximum available date range", disabled=not selected_symbol):
                    st.session_state.quick_fetch_max_clicked = True
                    st.session_state.selected_symbol = selected_symbol.upper()  # Update session state
                    st.rerun()
        else:
            selected_symbol = st.session_state.selected_symbol
            st.info("No symbols found")
    
    # Column 2: Start and End Dates (Row 1 and Row 2)
    with col2:
        # Get date values from session state (set by Max button or previous selections)
        start_date_value = st.session_state.get("quick_fetch_start", _get_default_start_date())
        end_date_value = st.session_state.get("quick_fetch_end", _get_default_end_date())
        
        start_date = st.date_input(
            "Start Date",
            value=start_date_value,
            max_value=_get_effective_today(),
            help="Start date for data range",
            key="quick_fetch_start"
        )
        end_date = st.date_input(
            "End Date",
            value=end_date_value,
            max_value=_get_effective_today(),
            help="End date for data range",
            key="quick_fetch_end"
        )
    
    # Column 3: Buttons (Row 1 and Row 2) - aligned with inputs
    with col3:
        # Initialize modal state for More Symbols button
        modal_key = "show_symbol_modal"
        if modal_key not in st.session_state:
            st.session_state[modal_key] = False
        
        # Row 1: More Symbols button (aligned with Symbol Search and Start Date inputs)
        # Add spacing to match input label height
        st.markdown('<p style="margin-bottom: 0; padding-bottom: 0; height: 1.5rem;"></p>', unsafe_allow_html=True)
        if st.button("🔍 More Symbols", type="primary", use_container_width=True, key="more_symbols_quick"):
            st.session_state[modal_key] = True
            st.rerun()
        
        # Row 2: Fetch Data button (aligned with Select Symbol and End Date inputs)
        # Add spacing to match input label height  
        st.markdown('<p style="margin-bottom: 0; padding-bottom: 0; height: 1.5rem;"></p>', unsafe_allow_html=True)
        if st.button("🔍 Fetch Data", type="primary", use_container_width=True, key="quick_fetch_btn"):
            force_refresh = False  # Quick fetch doesn't have refresh option
            if selected_symbol:
                st.session_state.selected_symbol = selected_symbol.upper()
                # Add to recent
                if selected_symbol not in st.session_state.recent_symbols:
                    st.session_state.recent_symbols.insert(0, selected_symbol)
                    st.session_state.recent_symbols = st.session_state.recent_symbols[:10]
                # Get cache setting from session state (set by checkbox)
                use_cache_val = st.session_state.get("quick_fetch_cache", True)
                # Get data source from session state (use default if not set)
                available_sources = get_available_sources()
                default_source = get_default_data_source()
                if 'data_source_quick' not in st.session_state:
                    st.session_state.data_source_quick = default_source
                data_source = st.session_state.data_source_quick
                return _handle_fetch(selected_symbol, start_date, end_date, use_cache_val, force_refresh, db_connected, data_source)
    
    return None


def _render_modal_data_fetcher(db_connected):
    """Render data fetcher as a modal-style component with separate search and browse sections"""
    # Initialize modal state
    modal_key = "show_symbol_modal"
    if modal_key not in st.session_state:
        st.session_state[modal_key] = False
    
    # Handle Max button click for quick fetch - set date values before widgets are created
    if 'quick_fetch_max_clicked' in st.session_state and st.session_state.quick_fetch_max_clicked:
        current_symbol = st.session_state.selected_symbol
        if current_symbol:
            max_start, max_end = _get_max_date_range_for_symbol(current_symbol, db_connected)
            if max_start and max_end:
                # Set session state values directly (before widgets are created)
                # This works because widgets use session state if key exists
                st.session_state.quick_fetch_start = max_start
                st.session_state.quick_fetch_end = max_end
            else:
                st.warning("Max date range not available for this symbol")
        st.session_state.quick_fetch_max_clicked = False
    
    # Quick fetch bar at the top (includes symbol display with Cache and Max)
    quick_fetch_result = _render_quick_fetch_bar(db_connected)
    if quick_fetch_result is not None:
        return quick_fetch_result
    
    # Render modal (expander) if open
    if st.session_state[modal_key]:
        with st.expander("🔍 Select Symbol & Fetch Data", expanded=True):
            # Two separate sections: Quick Search and Comprehensive Browse
            tab_search, tab_browse = st.tabs(["🔍 Quick Search", "📊 Browse All"])
            
            symbol = None
            with tab_search:
                symbol = _render_quick_search(db_connected)
                if symbol:
                    st.session_state.selected_symbol = symbol.upper()
                    # Add to recent
                    if symbol not in st.session_state.recent_symbols:
                        st.session_state.recent_symbols.insert(0, symbol)
                        st.session_state.recent_symbols = st.session_state.recent_symbols[:10]
            
            with tab_browse:
                browse_symbol = _render_comprehensive_browse(db_connected)
                if browse_symbol:
                    symbol = browse_symbol
            
            # Date Range and Options
            st.divider()
            
            # Get current symbol
            final_symbol = symbol or st.session_state.selected_symbol
            
            # Handle Max button click
            if 'max_date_clicked' in st.session_state and st.session_state.max_date_clicked:
                max_start, max_end = _get_max_date_range_for_symbol(final_symbol, db_connected)
                if max_start and max_end:
                    st.session_state.start_date_modal = max_start
                    st.session_state.end_date_modal = max_end
                else:
                    st.warning("Max date range not available for this symbol")
                st.session_state.max_date_clicked = False
            
            compact_cols = st.columns([2.5, 0.8, 1, 1, 1.2], gap="small")
            
            with compact_cols[0]:
                col_start, col_end = st.columns(2, gap="small")
                with col_start:
                    start_date_value = st.session_state.get("start_date_modal", _get_default_start_date())
                    start_date = st.date_input(
                        "Start",
                        value=start_date_value,
                        max_value=_get_effective_today(),
                        help="Start date",
                        key="start_date_modal"
                    )
                with col_end:
                    end_date_value = st.session_state.get("end_date_modal", _get_default_end_date())
                    end_date = st.date_input(
                        "End",
                        value=end_date_value,
                        max_value=_get_effective_today(),
                        help="End date",
                        key="end_date_modal"
                    )
            
            with compact_cols[1]:
                st.markdown("<br>", unsafe_allow_html=True)  # Align button with date inputs
                if final_symbol and st.button("Max", key="max_date_btn", use_container_width=True, help="Set to maximum available date range"):
                    st.session_state.max_date_clicked = True
                    st.rerun()
            
            with compact_cols[2]:
                use_cache = st.checkbox("Cache", value=True, help="Use cached data", key="use_cache_modal")
            
            with compact_cols[3]:
                force_refresh = st.checkbox("Refresh", value=False, help="Force refresh", key="force_refresh_modal")
            
            with compact_cols[4]:
                if st.button("🔍 Fetch", type="primary", use_container_width=True, key="fetch_btn_modal"):
                    # Get data source from session state (use default if not set)
                    available_sources = get_available_sources()
                    default_source = get_default_data_source()
                    if 'data_source_modal' not in st.session_state:
                        st.session_state.data_source_modal = default_source
                    data_source = st.session_state.data_source_modal
                    return _handle_fetch(final_symbol, start_date, end_date, use_cache, force_refresh, db_connected, data_source)
            
            # Return current data if available
            return st.session_state.data if st.session_state.data is not None else None
    
    # If modal is closed, return current data or None
    return st.session_state.data if st.session_state.data is not None else None


def _get_effective_today():
    """Get effective today date, handling system clock issues"""
    REASONABLE_MAX_DATE = datetime(2024, 12, 31).date()
    system_today = datetime.now().date()
    if system_today > REASONABLE_MAX_DATE:
        return REASONABLE_MAX_DATE
    return system_today


def _get_default_start_date():
    """Get default start date"""
    effective_today = _get_effective_today()
    default_end = effective_today - timedelta(days=1)
    return default_end - timedelta(days=365*3)


def _get_default_end_date():
    """Get default end date"""
    effective_today = _get_effective_today()
    return effective_today - timedelta(days=1)


def _get_max_date_range_for_symbol(symbol, db_connected):
    """Get the maximum date range available for a symbol"""
    if not symbol or not db_connected:
        return None, None
    
    try:
        metadata = get_symbol_metadata(symbol.upper())
        if metadata:
            start_date_str = metadata.get('start_date')
            end_date_str = metadata.get('end_date')
            
            if start_date_str and end_date_str:
                start_date = pd.to_datetime(start_date_str).date()
                end_date = pd.to_datetime(end_date_str).date()
                # Use yesterday or end_date, whichever is earlier
                effective_today = _get_effective_today()
                max_end = min(end_date, effective_today - timedelta(days=1))
                return start_date, max_end
    except Exception:
        pass
    
    return None, None


def _get_all_symbols_with_sources(db_connected):
    """Get all symbols from all sources with their source metadata"""
    symbols_dict = {}  # symbol -> {'source': 'DB'|'Ticker'|'Common', 'sector': sector or None}
    
    # Common symbols
    common_symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "SPY"]
    for sym in common_symbols:
        symbols_dict[sym.upper()] = {'source': 'Common', 'sector': None}
    
    # Database symbols
    if db_connected:
        db_symbols = get_database_symbols()
        for sym in db_symbols:
            sym_upper = sym.upper()
            if sym_upper not in symbols_dict:
                symbols_dict[sym_upper] = {'source': 'DB', 'sector': None}
            else:
                # If already exists, mark as both (but prefer DB)
                symbols_dict[sym_upper]['source'] = 'DB'
    
    # Tickers from JSON
    tickers_data = load_tickers_json()
    if tickers_data:
        for sector, tickers in tickers_data.items():
            for ticker in tickers:
                ticker_upper = ticker.upper()
                if ticker_upper not in symbols_dict:
                    symbols_dict[ticker_upper] = {'source': 'Ticker', 'sector': sector}
                elif symbols_dict[ticker_upper]['source'] == 'Common':
                    # Upgrade Common to Ticker if it's in tickers.json, add sector
                    symbols_dict[ticker_upper]['source'] = 'Ticker'
                    symbols_dict[ticker_upper]['sector'] = sector
    
    return symbols_dict


def _render_data_fetcher_controls(db_connected, compact=False):
    """Internal function to render data fetcher controls - Hybrid unified interface"""
    # Initialize session state for filter
    if 'symbol_filter_type' not in st.session_state:
        st.session_state.symbol_filter_type = 'All'
    if 'symbol_search_term' not in st.session_state:
        st.session_state.symbol_search_term = ''
    if 'symbol_sector_filter' not in st.session_state:
        st.session_state.symbol_sector_filter = 'All'
    
    # Get all symbols with metadata
    all_symbols_dict = _get_all_symbols_with_sources(db_connected)
    
    # Search bar
    search_key = "symbol_search_hybrid" + ("_compact" if compact else "_full")
    search_term = st.text_input(
        "🔍 Search Symbols",
        value=st.session_state.symbol_search_term,
        placeholder="Type to search all sources...",
        key=search_key
    )
    st.session_state.symbol_search_term = search_term
    
    # Filter chips
    tickers_data = load_tickers_json()
    sectors_list = list(tickers_data.keys()) if tickers_data else []
    
    filter_cols = st.columns([1, 1, 1, 1, 2], gap="small")
    with filter_cols[0]:
        filter_all_type = "primary" if st.session_state.symbol_filter_type == 'All' else "secondary"
        if st.button("All", key="filter_all", use_container_width=True, type=filter_all_type):
            st.session_state.symbol_filter_type = 'All'
            st.rerun()
    
    with filter_cols[1]:
        recent_count = len(st.session_state.recent_symbols) if st.session_state.recent_symbols else 0
        filter_recent_type = "primary" if st.session_state.symbol_filter_type == 'Recent' else "secondary"
        if st.button(f"Recent ({recent_count})", key="filter_recent", use_container_width=True, type=filter_recent_type):
            st.session_state.symbol_filter_type = 'Recent'
            st.rerun()
    
    with filter_cols[2]:
        filter_db_type = "primary" if st.session_state.symbol_filter_type == 'Database' else "secondary"
        if st.button("Database", key="filter_db", use_container_width=True, type=filter_db_type):
            st.session_state.symbol_filter_type = 'Database'
            st.rerun()
    
    with filter_cols[3]:
        filter_tickers_type = "primary" if st.session_state.symbol_filter_type == 'Tickers' else "secondary"
        if st.button("Tickers", key="filter_tickers", use_container_width=True, type=filter_tickers_type):
            st.session_state.symbol_filter_type = 'Tickers'
            st.rerun()
    
    with filter_cols[4]:
        if sectors_list:
            sectors_options = ["All"] + sectors_list
            sector_idx = sectors_options.index(st.session_state.symbol_sector_filter) if st.session_state.symbol_sector_filter in sectors_options else 0
            selected_sector = st.selectbox("Sector", sectors_options, index=sector_idx, key="sector_filter_hybrid")
            if selected_sector != st.session_state.symbol_sector_filter:
                st.session_state.symbol_sector_filter = selected_sector
                st.rerun()
    
    # Filter symbols based on search, filter type, and sector
    filtered_symbols = []
    for sym, metadata in sorted(all_symbols_dict.items()):
        # Apply source filter
        if st.session_state.symbol_filter_type == 'Recent':
            if sym not in st.session_state.recent_symbols:
                continue
        elif st.session_state.symbol_filter_type == 'Database':
            if metadata['source'] != 'DB':
                continue
        elif st.session_state.symbol_filter_type == 'Tickers':
            if metadata['source'] != 'Ticker':
                continue
        
        # Apply sector filter
        if st.session_state.symbol_sector_filter != 'All' and metadata['sector'] != st.session_state.symbol_sector_filter:
            continue
        
        # Apply search filter
        if search_term and search_term.upper() not in sym:
            continue
        
        filtered_symbols.append((sym, metadata))
    
    # Display symbol grid (6 columns)
    symbol = None
    if filtered_symbols:
        # Use 6 columns for the grid
        num_cols = 6
        num_rows = (len(filtered_symbols) + num_cols - 1) // num_cols
        
        grid_key_prefix = "hybrid_grid" + ("_compact" if compact else "_full")
        for row in range(num_rows):
            cols = st.columns(num_cols, gap="small")
            for col_idx in range(num_cols):
                sym_idx = row * num_cols + col_idx
                if sym_idx < len(filtered_symbols):
                    sym, metadata = filtered_symbols[sym_idx]
                    with cols[col_idx]:
                        # Source badge
                        source_badge = {
                            'DB': '🗄️',
                            'Ticker': '📋',
                            'Common': '⭐'
                        }.get(metadata['source'], '')
                        
                        button_label = f"{source_badge} {sym}" if source_badge else sym
                        if st.button(
                            button_label,
                            key=f"{grid_key_prefix}_{sym}_{sym_idx}",
                            use_container_width=True,
                            help=f"Source: {metadata['source']}" + (f", Sector: {metadata['sector']}" if metadata['sector'] else "")
                        ):
                            symbol = sym
                            st.session_state.selected_symbol = symbol
                            # Add to recent symbols (keep last 10)
                            if symbol not in st.session_state.recent_symbols:
                                st.session_state.recent_symbols.insert(0, symbol)
                                st.session_state.recent_symbols = st.session_state.recent_symbols[:10]
                            st.rerun()
    else:
        if search_term:
            st.info(f"No symbols found matching '{search_term}'")
        elif st.session_state.symbol_filter_type == 'Recent' and not st.session_state.recent_symbols:
            st.info("No recent symbols. Select a symbol to add it to recent.")
        elif st.session_state.symbol_filter_type == 'Database' and db_connected:
            db_symbols = get_database_symbols()
            if not db_symbols:
                st.info("No symbols in database. Use manual fetcher script to add data.")
        else:
            st.info("No symbols available")
    
    # Use selected symbol or default
    if not symbol:
        symbol = st.session_state.selected_symbol or "AAPL"
    else:
        st.session_state.selected_symbol = symbol.upper()
    
    # Date Range and Options - compact or regular layout
    if compact:
        # Ultra-compact horizontal layout: Everything in one row
        compact_cols = st.columns([2.5, 1, 1, 1.2], gap="small")
        
        with compact_cols[0]:
            col_start, col_end = st.columns(2, gap="small")
            with col_start:
                start_date = st.date_input(
                    "Start",
                    value=_get_default_start_date(),
                    max_value=_get_effective_today(),
                    help="Start date",
                    key="start_date_explorer"
                )
            with col_end:
                end_date = st.date_input(
                    "End",
                    value=_get_default_end_date(),
                    max_value=_get_effective_today(),
                    help="End date",
                    key="end_date_explorer"
                )
        
        with compact_cols[1]:
            use_cache = st.checkbox("Cache", value=True, help="Use cached data", key="use_cache_explorer")
        
        with compact_cols[2]:
            force_refresh = st.checkbox("Refresh", value=False, help="Force refresh", key="force_refresh_explorer")
        
        with compact_cols[3]:
            if st.button("🔍 Fetch", type="primary", use_container_width=True, key="fetch_btn_explorer"):
                # Get data source from session state (use default if not set)
                available_sources = get_available_sources()
                default_source = get_default_data_source()
                if 'data_source_explorer' not in st.session_state:
                    st.session_state.data_source_explorer = default_source
                data_source = st.session_state.data_source_explorer
                return _handle_fetch(symbol, start_date, end_date, use_cache, force_refresh, db_connected, data_source)
    else:
        # Regular layout for standalone mode
        col_date_opts = st.columns([2, 1], gap="medium")
        
        with col_date_opts[0]:
            st.markdown("**📅 Date Range**")
            col_start, col_end = st.columns(2, gap="small")
            with col_start:
                start_date = st.date_input(
                    "Start",
                    value=_get_default_start_date(),
                    max_value=_get_effective_today(),
                    help="Start date for data fetch",
                    key="start_date_backtest"
                )
            with col_end:
                end_date = st.date_input(
                    "End",
                    value=_get_default_end_date(),
                    max_value=_get_effective_today(),
                    help="End date for data fetch",
                    key="end_date_backtest"
                )
        
        with col_date_opts[1]:
            st.markdown("**⚙️ Options**")
            use_cache = st.checkbox("Use cache", value=True, help="Use cached data if available", key="use_cache_backtest")
            force_refresh = st.checkbox("Force refresh", value=False, help="Force refresh from source", key="force_refresh_backtest")
            
            # Data source selection
            available_sources = get_available_sources()
            default_source = get_default_data_source()
            if 'data_source_backtest' not in st.session_state:
                st.session_state.data_source_backtest = default_source
            data_source = st.selectbox(
                "Data source",
                options=available_sources,
                index=available_sources.index(st.session_state.data_source_backtest) if st.session_state.data_source_backtest in available_sources else 0,
                help="Select data source for fetching",
                key="data_source_backtest"
            )
        
        # Fetch button
        if st.button("🔍 Fetch Data", type="primary", use_container_width=True, key="fetch_btn_backtest"):
            return _handle_fetch(symbol, start_date, end_date, use_cache, force_refresh, db_connected, data_source)
    
    # Show current status (compact)
    if st.session_state.data is not None and st.session_state.selected_symbol == symbol.upper():
        st.caption(f"✓ {symbol}")
    
    return st.session_state.data if st.session_state.data is not None else None


def _handle_fetch(symbol, start_date, end_date, use_cache, force_refresh, db_connected, data_source=None):
    """Handle data fetching logic"""
    if not symbol:
        st.error("Please select a symbol")
        return None
    
    if start_date >= end_date:
        st.error("Start date must be before end date")
        return None
    
    symbol = symbol.upper()
    
    with st.spinner(f"Fetching {symbol}..."):
        try:
            registry = get_registry()
            fetcher = registry.create(source=data_source)
            store = DataStore()
            start_str = start_date.strftime('%Y-%m-%d')
            end_str = end_date.strftime('%Y-%m-%d')
            
            if use_cache and not force_refresh and db_connected:
                try:
                    if store.exists(symbol):
                        data = store.load(symbol, start=start_str, end=end_str)
                        if data is not None and not data.empty:
                            st.session_state.data = data
                            st.session_state.selected_symbol = symbol
                            st.success(f"✅ Loaded {len(data)} rows")
                            st.rerun()
                except Exception:
                    pass
            
            data = fetcher.fetch_ohlcv(symbol, start=start_str, end=end_str)
            
            if data.empty:
                st.error(f"❌ No data for {symbol}")
                return None
            
            if db_connected:
                try:
                    store.save(symbol, data)
                except Exception:
                    pass
            
            st.session_state.data = data
            st.session_state.selected_symbol = symbol
            st.success(f"✅ Fetched {len(data)} rows")
            st.rerun()
            
        except Exception as e:
            error_msg = str(e)
            if "No timezone found" in error_msg or "delisted" in error_msg.lower():
                st.error(f"❌ Invalid symbol: {symbol}")
            elif "Expecting value" in error_msg or "JSON" in error_msg:
                st.error("❌ API error. Please try again.")
            else:
                st.error(f"❌ Error: {error_msg[:80]}")
            return None
    
    return None
