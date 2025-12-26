# Cyber Blue + Zinc Dark Theme - Color Migration Guide

## 🎨 Color Palette Overview

### Base Colors
```css
Background (Main):     #09090B  (zinc-950)
Surface (Cards):       #18181B  (zinc-900)
Surface Hover:         #27272A  (zinc-800)
Border:                #3F3F46  (zinc-700)

Text Primary:          #E5E7EB  (gray-200)
Text Secondary:        #71717A  (zinc-500)
Text Tertiary:         #52525B  (zinc-600)

Primary (Cyan):        #06B6D4  (cyan-500)
Primary Hover:         #0891B2  (cyan-600)
Primary Light:         #22D3EE  (cyan-400)

Success:               #10B981  (emerald-500)
Error:                 #EF4444  (red-500)
Warning:               #F59E0B  (amber-500)
Info:                  #3B82F6  (blue-500)
```

## 📝 Migration Checklist

### Old → New Class Mappings

#### Backgrounds
- `bg-[#1e1e1e]` → `bg-background`
- `bg-[#252526]` → `bg-surface`
- `bg-gray-800` → `bg-surface`
- `bg-gray-900` → `bg-background`

#### Text Colors
- `text-[#cccccc]` → `text-text-primary`
- `text-gray-400` → `text-text-secondary`
- `text-gray-500` → `text-text-tertiary`

#### Borders
- `border-[#3e3e42]` → `border-border`
- `border-gray-700` → `border-border`

#### Accent/Primary Colors
- `text-blue-500` → `text-primary`
- `bg-blue-500` → `bg-primary`
- `hover:bg-blue-600` → `hover:bg-primary-hover`
- `border-blue-500` → `border-primary`

#### Status Colors (Keep semantic Tailwind)
- `text-green-500` → `text-success`
- `text-red-500` → `text-error`
- `text-yellow-500` → `text-warning`

## 🎯 Common Component Patterns

### Buttons
```tsx
// Primary
<button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors">

// Secondary
<button className="bg-surface hover:bg-surface-hover text-text-primary border border-border px-4 py-2 rounded-lg">

// Ghost
<button className="hover:bg-surface-hover text-text-primary px-4 py-2 rounded-lg">

// Danger
<button className="bg-error hover:bg-red-600 text-white px-4 py-2 rounded-lg">
```

### Cards
```tsx
<div className="bg-surface border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
  <h3 className="text-text-primary font-semibold">Title</h3>
  <p className="text-text-secondary text-sm">Description</p>
</div>
```

### Input Fields
```tsx
<input
  className="bg-background border border-border text-text-primary px-3 py-2 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
  placeholder="Enter value..."
/>
```

### Status Badges
```tsx
// Success
<span className="bg-success/10 text-success border border-success/30 px-2 py-1 rounded text-xs">
  Connected
</span>

// Error
<span className="bg-error/10 text-error border border-error/30 px-2 py-1 rounded text-xs">
  Failed
</span>

// Info
<span className="bg-primary-subtle text-primary-light border border-primary/30 px-2 py-1 rounded text-xs">
  Connecting...
</span>
```

### Interactive Lists
```tsx
<div className="bg-surface border border-border rounded-lg overflow-hidden">
  {items.map(item => (
    <div
      key={item.id}
      className="px-4 py-3 hover:bg-surface-hover border-b border-border last:border-b-0 cursor-pointer transition-colors"
    >
      <div className="text-text-primary font-medium">{item.name}</div>
      <div className="text-text-secondary text-sm">{item.description}</div>
    </div>
  ))}
</div>
```

### Modals/Panels
```tsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-surface border border-border rounded-xl shadow-xl max-w-2xl w-full mx-4">
    {/* Header */}
    <div className="px-6 py-4 border-b border-border">
      <h2 className="text-text-primary text-xl font-semibold">Modal Title</h2>
    </div>
    
    {/* Content */}
    <div className="px-6 py-4 text-text-secondary">
      Content here
    </div>
    
    {/* Footer */}
    <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
      <button className="bg-surface hover:bg-surface-hover text-text-primary border border-border px-4 py-2 rounded-lg">
        Cancel
      </button>
      <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Terminal Styling
```tsx
// Terminal container
<div className="bg-black border border-border rounded-lg overflow-hidden">
  <div ref={terminalRef} className="p-2" />
</div>

// xterm.js theme config
{
  background: '#000000',
  foreground: '#E5E7EB',
  cursor: '#06B6D4',
  cursorAccent: '#000000',
  selection: 'rgba(6, 182, 212, 0.3)',
  // ... ANSI colors
}
```

### Focus States
```tsx
// Always include focus rings for accessibility
className="focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
```

### Gradients (Special Elements)
```tsx
// Logo, splash screens
<div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-8 rounded-xl">
  
// Subtle gradient backgrounds
<div className="bg-gradient-to-br from-primary/10 to-secondary/10">
```

## 🚀 Implementation Priority

### Phase 1: Core Components (Today)
- [x] tailwind.config.js - Color definitions
- [x] index.css - Base body styles
- [x] theme.ts - Reusable constants
- [ ] AppShell, TopBar, Sidebar - Layout components
- [ ] Dashboard - Main screen
- [ ] ProfileManager - Modal dialogs

### Phase 2: Feature Components (Tomorrow)
- [ ] Terminal - Pure black background
- [ ] SFTPManager - File browser
- [ ] TunnelManager - Port forwarding UI
- [ ] SettingsPanel - Settings screens
- [ ] CommandPalette - Quick actions

### Phase 3: Small Components (Week 1)
- [ ] Buttons, badges, alerts
- [ ] Input fields, selects, checkboxes
- [ ] Cards, lists, tables
- [ ] Tooltips, dropdowns, modals

## 🎨 Design Principles

1. **High Contrast** - Ensure 4.5:1 minimum for text (WCAG AA)
2. **Consistent Spacing** - Use Tailwind's spacing scale (p-4, gap-2, etc.)
3. **Smooth Transitions** - Always add `transition-colors` or `transition-all`
4. **Focus Indicators** - Never remove focus rings, style them instead
5. **Semantic Colors** - Use success/error/warning for status, not random colors
6. **Terminal First** - Optimize for long coding sessions (no bright colors)

## 🧪 Testing

### Visual Regression Checklist
- [ ] All buttons visible and clickable
- [ ] All text readable (no low contrast)
- [ ] Borders visible but not distracting
- [ ] Focus states clearly visible
- [ ] Hover states provide feedback
- [ ] Status colors distinguishable
- [ ] Terminal output readable

### Accessibility Checklist
- [ ] Color contrast WCAG AA compliant
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Status not conveyed by color alone (use icons)

## 📚 Resources

- Tailwind Docs: https://tailwindcss.com/docs
- Color Contrast Checker: https://webaim.org/resources/contrastchecker/
- Design Inspiration: GitHub, Vercel, Railway, Linear

---

**Need Help?** Check `src/styles/theme.ts` for all available color tokens and common patterns.
