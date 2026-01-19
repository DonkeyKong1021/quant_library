"""AI Insights component for backtest results.

Displays AI-generated analysis of backtest performance in an
expandable section within the results display.
"""

import streamlit as st
from streamlit_app.utils.ai_insights import get_insights_for_results


def ai_insights_component(
    results: dict,
    strategy_name: str = "Unknown Strategy",
    symbol: str = "Unknown"
):
    """
    Display AI-generated insights for backtest results.
    
    Args:
        results: Backtest results dictionary
        strategy_name: Name of the strategy used
        symbol: Trading symbol
    """
    if results is None or not results:
        return
    
    with st.expander("AI Insights", expanded=False):
        # Check if we should generate insights
        if "ai_insights_generated" not in st.session_state:
            st.session_state.ai_insights_generated = False
        
        # Show generate button if not yet generated
        if not st.session_state.ai_insights_generated:
            st.markdown(
                "Get AI-powered analysis of your backtest results, including "
                "performance interpretation, risk assessment, and improvement suggestions."
            )
            
            if st.button("Generate AI Insights", type="primary", use_container_width=True):
                st.session_state.ai_insights_generated = True
                st.rerun()
            return
        
        # Generate insights
        with st.spinner("Analyzing backtest results..."):
            insights = get_insights_for_results(
                results=results,
                strategy_name=strategy_name,
                symbol=symbol
            )
        
        # Handle errors
        if insights.get("error"):
            error_type = insights["error"]
            
            if error_type == "no_api_key":
                st.info(
                    "**AI Insights requires an API key**\n\n"
                    "To enable AI-powered analysis, add one of the following "
                    "to your `.env` file:\n"
                    "- `OPENAI_API_KEY=your_key_here`\n"
                    "- `ANTHROPIC_API_KEY=your_key_here`"
                )
            else:
                st.warning(
                    f"Could not generate insights: {insights.get('message', 'Unknown error')}"
                )
            
            # Allow retry
            if st.button("Try Again"):
                st.session_state.ai_insights_generated = False
                st.rerun()
            return
        
        # Display insights
        _display_insights(insights)
        
        # Reset button
        col1, col2 = st.columns([3, 1])
        with col2:
            if st.button("Regenerate", help="Generate new insights"):
                # Clear cache by changing session state
                st.session_state.ai_insights_generated = False
                st.cache_data.clear()
                st.rerun()


def _display_insights(insights: dict):
    """Display the formatted AI insights."""
    
    # Summary
    summary = insights.get("summary", "")
    if summary:
        st.markdown(f"**Summary:** {summary}")
        st.markdown("")
    
    # Create columns for strengths and concerns
    col1, col2 = st.columns(2)
    
    with col1:
        strengths = insights.get("strengths", [])
        if strengths:
            st.markdown("**Strengths**")
            for strength in strengths:
                st.markdown(f"- {strength}")
    
    with col2:
        concerns = insights.get("concerns", [])
        if concerns:
            st.markdown("**Concerns**")
            for concern in concerns:
                st.markdown(f"- {concern}")
    
    # Suggestions
    suggestions = insights.get("suggestions", [])
    if suggestions:
        st.markdown("")
        st.markdown("**Suggestions for Improvement**")
        for i, suggestion in enumerate(suggestions, 1):
            st.markdown(f"{i}. {suggestion}")
