import { useState, useEffect } from 'react';
import { Book, Search, Plus, Tag } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/axios';

const KnowledgeBasePage = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newArt, setNewArt] = useState({ title: '', contentMarkdown: '', category: 'General' });

  useEffect(() => {
    fetchKB();
  }, [search]);

  const fetchKB = async () => {
    try {
      setLoading(true);
      const [artRes, catRes] = await Promise.all([
        api.get('/kb/articles', { params: { search, size: 50 } }),
        api.get('/kb/articles/categories')
      ]);
      setArticles(artRes.data.content || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Logic for creating a new article
      await api.post('/kb/articles', newArt);
      setShowModal(false);
      setNewArt({ title: '', contentMarkdown: '', category: 'General' });
      fetchKB();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="h2">Knowledge Base</h1>
          <p className="text-secondary">Security guides, operating procedures, and documentation</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="hover-lift flex items-center gap-2" 
          style={{
            padding: '0.625rem 1rem', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 500
          }}
        >
          <Plus size={18} /> New Article
        </button>
      </div>

      <div className="flex gap-6">
        <div style={{ width: '250px' }} className="flex flex-col gap-4">
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 className="h4 mb-4" style={{ marginBottom: '1rem' }}>Categories</h3>
            <div className="flex flex-col gap-2 cursor-pointer">
              <div className="text-sm text-primary font-medium p-2 bg-primary-transparent rounded" style={{ padding: '0.5rem', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)' }}>All Articles</div>
              {categories.map(cat => (
                <div key={cat} className="text-sm text-secondary hover-lift" style={{ padding: '0.5rem' }}>{cat}</div>
              ))}
              {categories.length === 0 && <div className="text-sm text-muted">No categories</div>}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} className="flex flex-col gap-4">
          <div className="glass-panel flex items-center gap-3" style={{ padding: '0.75rem 1rem' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search articles..." 
              className="form-input" 
              style={{ border: 'none', background: 'transparent', padding: 0 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-muted p-4">Loading articles...</div>
            ) : articles.length === 0 ? (
              <div className="glass-panel p-8 text-center text-muted" style={{ padding: '3rem', textAlign: 'center' }}>No articles found matching your criteria.</div>
            ) : (
              articles.map(art => (
                <div key={art.id} className="glass-panel hover-lift cursor-pointer" style={{ padding: '1.5rem' }}>
                  <div className="flex justify-between items-start mb-2" style={{ marginBottom: '0.5rem' }}>
                    <h3 className="h3 text-primary">{art.title}</h3>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)' }}>
                      {format(new Date(art.updatedAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-3" style={{ marginBottom: '1rem' }}>
                    <span className="flex items-center gap-1 text-xs text-secondary bg-surface rounded px-2 py-1" style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-surface)', borderRadius: '4px' }}>
                      <Tag size={12}/> {art.category}
                    </span>
                    <span className="text-xs text-muted">By {art.author.fullName}</span>
                  </div>
                  <p className="text-sm text-secondary line-clamp-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {art.contentMarkdown}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 
        }}>
          <div className="glass-panel animate-scale-up" style={{ width: '600px', padding: '2rem' }}>
            <h3 className="h3 mb-6" style={{ marginBottom: '1.5rem' }}>New Article</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-secondary block mb-1">Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newArt.title}
                  onChange={e => setNewArt({...newArt, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-secondary block mb-1">Category</label>
                <select 
                  className="form-input"
                  value={newArt.category}
                  onChange={e => setNewArt({...newArt, category: e.target.value})}
                >
                  <option value="General">General</option>
                  <option value="Security Policy">Security Policy</option>
                  <option value="Incident Response">Incident Response</option>
                  <option value="Training">Training</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-secondary block mb-1">Content (Markdown supported)</label>
                <textarea 
                  className="form-input" 
                  rows={8}
                  style={{ fontFamily: 'monospace' }}
                  value={newArt.contentMarkdown}
                  onChange={e => setNewArt({...newArt, contentMarkdown: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-2 mt-4" style={{ marginTop: '1.5rem' }}>
                <button type="submit" className="glass-panel px-4 py-2 hover-lift text-primary flex-1">Publish Article</button>
                <button type="button" onClick={() => setShowModal(false)} className="glass-panel px-4 py-2 hover-lift text-muted flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBasePage;
