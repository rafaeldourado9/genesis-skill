# Contributing to Genesis

Thank you for your interest in contributing! Genesis gets better with every new agent, language adapter, and real-world use case.

## Ways to Contribute

### 1. Add a language/framework adapter

`genesis-backend` and `genesis-frontend` have adapters for the most common stacks. If yours is missing, add a section to the relevant SKILL.md.

```markdown
### Ruby + Rails

**Structure:**
```
app/
├── controllers/
│   └── api/v1/{domain}_controller.rb
├── models/
│   └── {domain}.rb
├── services/
│   └── {domain}_service.rb
└── serializers/
    └── {domain}_serializer.rb
```
```

### 2. Create a domain-specific agent

Genesis agents are just SKILL.md files. If you have expertise in a specific domain (e-commerce, healthcare, IoT, ML), create a specialized agent:

```
.agents/skills/
└── genesis-ecommerce/
    └── SKILL.md    ← your domain-specific guidance
```

### 3. Share a real project built with Genesis

Add it to [`examples/`](examples/) with a brief README showing what Genesis generated vs what you customized.

### 4. Improve existing agents

Found a pattern that works better? Improve an existing SKILL.md with a PR explaining why.

### 5. Report issues

Found a case where Genesis gave bad advice? Open an issue with:
- The project type (backend, fullstack, mobile)
- The tech stack
- What Genesis produced
- What it should have produced instead

---

## Development Setup

```bash
git clone https://github.com/rafaeldourado9/genesis.git
cd genesis

# No dependencies — Genesis is just SKILL.md files
# Test by installing in a sample project:
bash install.sh /tmp/test-project
```

## Pull Request Process

1. Fork the repo
2. Create a branch: `git checkout -b feat/ruby-rails-adapter`
3. Make your changes
4. Ensure SKILL.md files follow the existing format (frontmatter + structured sections)
5. Open a PR with:
   - What you added/changed
   - Example of what Genesis now produces with your change
   - Any trade-offs or limitations

## SKILL.md Format

All agents must have frontmatter:

```yaml
---
name: genesis-{name}
description: >
  One paragraph description. Used by AI to decide when to invoke this agent.
metadata:
  author: {your-github-handle}
  version: "1.0.0"
  role: {role}
  framework: genesis
---
```

## Code of Conduct

Be kind. We're all here to build better software faster.

Questions? Open a [Discussion](https://github.com/rafaeldourado9/genesis/discussions).
