# RecipeNest Documentation

Welcome to the RecipeNest project documentation! This folder contains comprehensive documentation for the entire project, organized by purpose and audience.

## 📚 **Documentation Overview**

### **For Product & Planning**
- **[RecipeNest_PRD.md](./RecipeNest_PRD.md)** - Product requirements, features, and specifications

### **For Developers & Contributors**
- **[project-history.md](./project-history.md)** - Complete development journey, decisions, and context
- **[architecture.md](./architecture.md)** - Technical architecture, patterns, and implementation details

### **For Users & Stakeholders**
- **[changelog.md](./changelog.md)** - Official release notes, new features, and breaking changes

### **For Database & DevOps**
- **[database-schema.md](./database-schema.md)** - Complete database schema, relationships, and constraints
- **[rls-policies.md](./rls-policies.md)** - Row Level Security policy details and testing
- **[database-functions.md](./database-functions.md)** - Database functions, triggers, and performance
- **[storage-policies.md](./storage-policies.md)** - Supabase storage bucket policies and organization

### **For API & Component Development**
- **[api-reference.md](./api-reference.md)** - Server actions, route handlers, and API schemas
- **[component-interfaces.md](./component-interfaces.md)** - Component interfaces, patterns, and best practices

---

## 🎯 **Quick Navigation by Topic**

### **Getting Started**
- **New to the project?** Start with [project-history.md](./project-history.md) for context
- **Understanding requirements?** Review [RecipeNest_PRD.md](./RecipeNest_PRD.md) for product specs
- **Setting up development?** See [architecture.md](./architecture.md) for technical details
- **Deploying?** Check [database-schema.md](./database-schema.md) for database setup

### **Development Work**
- **Adding features?** Review [project-history.md](./project-history.md) for patterns
- **Debugging issues?** Check [project-history.md](./project-history.md) for known solutions
- **Database changes?** Update [database-schema.md](./database-schema.md) first
- **Building components?** See [component-interfaces.md](./component-interfaces.md) for patterns

### **Release Management**
- **Planning a release?** Update [changelog.md](./changelog.md) with changes
- **Breaking changes?** Document in [changelog.md](./changelog.md) under appropriate version

---

## 🔄 **Documentation Maintenance**

### **When to Update Each File**

#### **project-history.md**
- ✅ New features implemented
- ✅ Major bug fixes resolved
- ✅ Architecture decisions made
- ✅ Performance improvements
- ✅ Lessons learned

#### **changelog.md**
- ✅ New version releases
- ✅ Breaking changes
- ✅ User-facing features
- ✅ Migration notes

#### **database-schema.md**
- ✅ New tables or columns
- ✅ RLS policy changes
- ✅ Function or trigger updates
- ✅ Index modifications

#### **architecture.md**
- ✅ New architectural patterns
- ✅ Directory structure changes
- ✅ Technology stack updates
- ✅ Performance considerations

---

## 📁 **File Structure**

```
docs/
├── README.md                    ← This index file
├── RecipeNest_PRD.md           ← Product requirements & specifications
├── project-history.md           ← Development history & context
├── changelog.md                ← Release notes & versions
├── architecture.md             ← Technical architecture
├── database-schema.md          ← Database schema & relationships
├── rls-policies.md             ← RLS policy details & testing
├── database-functions.md       ← Database functions & triggers
├── storage-policies.md         ← Storage bucket policies & organization
├── api-reference.md            ← API endpoints & server actions
├── component-interfaces.md     ← Component interfaces & patterns
└── old/                        ← Legacy documentation (archived)
    ├── ARCHITECTURE.md         ← Previous architecture docs
    ├── PROJECT_HISTORY.md      ← Previous project history
    ├── CHANGELOG.md            ← Previous changelog
    ├── database_context.md     ← Previous database context
    ├── db_functions.md         ← Previous database functions
    ├── rls_policies.md         ← Previous RLS policies
    ├── table_schemas.md        ← Previous table schemas
    └── STORAGE_POLICIES.md     ← Previous storage policies
```

---

## 🚀 **Contributing to Documentation**

### **Guidelines**
1. **Keep it current** - Update docs when code changes
2. **Be specific** - Include file paths, error messages, solutions
3. **Cross-reference** - Link between related documentation
4. **Use consistent formatting** - Follow existing patterns

### **Template for Updates**
When adding new entries to project-history.md:

```markdown
## [Date] - [Feature/Bug/Change]

**Scope:** [feature|bugfix|refactor|performance]
**Files:** [relative paths to modified files]
**Why:** [problem being solved or improvement made]
**What changed:**
- [specific changes made]

**Testing:** [how it was tested]
**Impact:** [performance|UX|security|database|none]
```

---

## 🔍 **Finding Information**

### **Search by Keywords**
- **"follows system"** → [project-history.md](./project-history.md) Phase 4
- **"database errors"** → [project-history.md](./project-history.md) Bug Fixes section
- **"RLS policies"** → [rls-policies.md](./rls-policies.md) RLS section
- **"component architecture"** → [architecture.md](./architecture.md) Component section
- **"product features"** → [RecipeNest_PRD.md](./RecipeNest_PRD.md) Features section

### **Search by File Type**
- **Product requirements** → [RecipeNest_PRD.md](./RecipeNest_PRD.md)
- **Code changes** → [project-history.md](./project-history.md)
- **Database schema** → [database-schema.md](./database-schema.md)
- **System design** → [architecture.md](./architecture.md)
- **User features** → [changelog.md](./changelog.md)
- **API documentation** → [api-reference.md](./api-reference.md)
- **Component patterns** → [component-interfaces.md](./component-interfaces.md)

---

## 📞 **Need Help?**

If you can't find what you're looking for:

1. **Check project-history.md** - Most comprehensive source
2. **Search the codebase** - Look for recent changes
3. **Check database-schema.md** - For database-related issues
4. **Review architecture.md** - For system-level questions
5. **Check api-reference.md** - For API and server action questions
6. **Review component-interfaces.md** - For component development

---

## 📚 **Legacy Documentation**

The `old/` folder contains previous versions of documentation files that have been replaced with improved, expanded versions. These files are kept for reference but are no longer maintained:

- **ARCHITECTURE.md** → Replaced by [architecture.md](./architecture.md)
- **PROJECT_HISTORY.md** → Replaced by [project-history.md](./project-history.md)
- **CHANGELOG.md** → Replaced by [changelog.md](./changelog.md)
- **database_context.md** → Replaced by [database-schema.md](./database-schema.md)
- **db_functions.md** → Replaced by [database-functions.md](./database-functions.md)
- **rls_policies.md** → Replaced by [rls-policies.md](./rls-policies.md)
- **table_schemas.md** → Replaced by [database-schema.md](./database-schema.md)
- **STORAGE_POLICIES.md** → Replaced by [storage-policies.md](./storage-policies.md)

---

*This documentation system is designed to be the single source of truth for the RecipeNest project. Keep it updated and accurate for the benefit of all contributors and users.*
