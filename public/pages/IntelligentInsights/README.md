# Intelligent Insights Page

## Task Summary

**Objective**: Implement the same functionality and similar frontend from `ref/OpenSearch-Intelligent-Insights/src/open_search_intelligent_insights/frontend/` in OpenSearch-Dashboards format for query insights dashboards, placing it parallel to the `public/pages/TopNQueries/` page.

## What Was Done

### 1. Analysis Phase
- Analyzed the original OpenSearch-Intelligent-Insights frontend structure
- Examined key components like Conversation, WorkflowSelector, InputArea, etc.
- Studied the existing TopNQueries page structure for consistency
- Identified the architecture patterns and component relationships

### 2. Implementation Phase

#### Main Page Structure
- **IntelligentInsights.tsx**: Main page component with three-panel layout using EuiResizableContainer
  - Left panel: Conversation sidebar (collapsible)
  - Center panel: Main conversation area
  - Right panel: Workflow progress sidebar (collapsible)

#### Components Implemented
- **ConversationSidebar.tsx**: Manages conversation threads and creation
- **Conversation.tsx**: Main conversation interface with message display
- **InputArea.tsx**: Message input with workflow selector
- **MessageDisplay.tsx**: Renders human and AI messages with proper styling
- **WorkflowSelector.tsx**: Dropdown for selecting AI workflow types
- **WorkflowProgressSidebar.tsx**: Shows workflow execution progress
- **TokenCounter.tsx**: Displays token usage information

#### Interactive Components
- **MetricPicker.tsx**: Interface for metric selection interrupts
- **SopPicker.tsx**: Standard Operating Procedure selection
- **TicketPicker.tsx**: Ticket selection interface
- **ParameterCollector.tsx**: Dynamic parameter collection forms
- **HumanInputRequest.tsx**: Human input request handler
- **StepExecutionDisplay.tsx**: Step-by-step execution interface
- **ToolOutputDisplay.tsx**: Tool execution results visualization

#### Hooks and State Management
- **useLangGraph.ts**: Manages threads, assistants, and conversation state
- **useLangGraphConversation.ts**: Handles conversation flow and interrupts

#### Type Definitions
- **langgraph.ts**: TypeScript interfaces matching the original LangGraph types

### 3. Navigation Integration
- Added "Intelligent Insights" tab to the existing navigation
- Integrated routing with `/intelligentInsights` path
- Updated TopNQueries.tsx to include the new route and tab

### 4. Testing
- Created basic test file (IntelligentInsights.test.tsx) with component rendering tests

## Architecture

### Frontend Framework
- **React**: Main UI framework
- **TypeScript**: Type safety and development experience
- **EUI (Elastic UI)**: Consistent with OpenSearch-Dashboards design system

### Key Features
1. **Conversation Management**: Thread-based conversation system
2. **Workflow Selection**: Multiple AI workflow types (Auto-route, RCA, Documentation Search, etc.)
3. **Interactive Interrupts**: Handle various user input requirements
4. **Real-time Updates**: Workflow progress and step execution tracking
5. **Responsive Design**: Collapsible sidebars and resizable panels

### Component Hierarchy
```
IntelligentInsights
├── ConversationSidebar
├── Conversation
│   ├── MessageDisplay
│   ├── MetricPicker
│   ├── SopPicker
│   ├── TicketPicker
│   ├── ParameterCollector
│   ├── HumanInputRequest
│   ├── StepExecutionDisplay
│   └── ToolOutputDisplay
├── InputArea
│   ├── WorkflowSelector
│   └── TokenCounter
└── WorkflowProgressSidebar
```

## Current Status

✅ **Completed:**
- Full component implementation in OpenSearch-Dashboards format
- Integration with existing navigation and routing
- Type definitions and hooks for state management
- Mock data structures for development
- Error handling and loading states

⚠️ **Mock Implementation:**
- Currently uses mock data and API calls
- Ready for integration with actual LangGraph backend
- All interfaces match the original implementation

## Next Steps

1. **Backend Integration**: Connect to actual LangGraph API endpoints
2. **Authentication**: Implement proper authentication flow
3. **Error Handling**: Add comprehensive error handling
4. **Performance**: Optimize for large conversation histories
5. **Accessibility**: Enhance accessibility features

## Files Overview

| File | Purpose |
|------|---------|
| `IntelligentInsights.tsx` | Main page component with layout |
| `Components/Conversation.tsx` | Main conversation interface |
| `Components/ConversationSidebar.tsx` | Thread management sidebar |
| `Components/InputArea.tsx` | Message input with workflow selection |
| `Components/WorkflowSelector.tsx` | AI workflow selection dropdown |
| `Components/MessageDisplay.tsx` | Message rendering with avatars |
| `Components/WorkflowProgressSidebar.tsx` | Workflow execution progress |
| `Components/*Picker.tsx` | Various interrupt handling components |
| `hooks/useLangGraph.ts` | Main conversation state management |
| `hooks/useLangGraphConversation.ts` | Conversation flow management |
| `types/langgraph.ts` | TypeScript type definitions |

The implementation provides a complete foundation for intelligent insights functionality while maintaining consistency with OpenSearch-Dashboards design patterns and user experience.