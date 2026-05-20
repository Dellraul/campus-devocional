import React, { useState, useEffect } from 'react';
import { Book, BookOpen, PenTool, User, LogOut, CheckCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

// --- TU CEREBRO (BASE DE DATOS FIREBASE) ---
const firebaseConfig = {
  apiKey: "AIzaSyAU91lwaVlflH9HzWeqdtZX7dqnMHBr5wM",
  authDomain: "campus-metanoiawe.firebaseapp.com",
  projectId: "campus-metanoiawe",
  storageBucket: "campus-metanoiawe.firebasestorage.app",
  messagingSenderId: "984237985997",
  appId: "1:984237985997:web:eb7170214863a253b81984"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- APLICACIÓN PRINCIPAL ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(''); // 'profesor' o 'estudiante'
  const [activeTab, setActiveTab] = useState('devocionales');
  const [devotionals, setDevotionals] = useState([]);
  const [newDevotional, setNewDevotional] = useState({ title: '', content: '' });

  // Cargar devocionales desde Firebase al iniciar
  useEffect(() => {
    if (isLoggedIn) {
      loadDevotionals();
    }
  }, [isLoggedIn]);

  const loadDevotionals = async () => {
    try {
      const q = query(collection(db, "devocionales"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDevotionals(data);
    } catch (error) {
      console.error("Error al cargar devocionales:", error);
    }
  };

  const handleLogin = (selectedRole) => {
    setRole(selectedRole);
    setIsLoggedIn(true);
  };

  const handlePublish = async () => {
    if (!newDevotional.title || !newDevotional.content) return;
    try {
      await addDoc(collection(db, "devocionales"), {
        title: newDevotional.title,
        content: newDevotional.content,
        author: "Profesor",
        date: new Date().toISOString()
      });
      setNewDevotional({ title: '', content: '' });
      loadDevotionals();
      alert("¡Devocional publicado con éxito!");
    } catch (error) {
      console.error("Error al publicar:", error);
      alert("Hubo un error al publicar. Revisa tu conexión.");
    }
  };

  // --- PANTALLA DE INICIO DE SESIÓN ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Campus Devocional Metanoia</h1>
          <p className="text-gray-600 mb-8">Selecciona tu rol para ingresar</p>
          <div className="space-y-4">
            <button 
              onClick={() => handleLogin('profesor')}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition"
            >
              <PenTool className="w-5 h-5" /> Ingresar como Profesor
            </button>
            <button 
              onClick={() => handleLogin('estudiante')}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition"
            >
              <User className="w-5 h-5" /> Ingresar como Estudiante
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- PANTALLA PRINCIPAL (CAMPUS) ---
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Barra superior */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-blue-600">
          <BookOpen className="w-6 h-6" />
          <span className="text-xl font-bold">Metanoia Campus</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium capitalize">
            {role}
          </span>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="text-gray-500 hover:text-red-500 transition flex items-center gap-1"
          >
            <LogOut className="w-5 h-5" /> Salir
          </button>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto mt-8 p-4">
        
        {/* Menú de pestañas */}
        <div className="flex gap-4 mb-8 border-b pb-4">
          <button 
            onClick={() => setActiveTab('devocionales')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'devocionales' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Book className="w-5 h-5" /> Devocionales
          </button>
          <button 
            onClick={() => setActiveTab('biblia')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'biblia' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <BookOpen className="w-5 h-5" /> Biblia Offline
          </button>
        </div>

        {/* Sección: Devocionales */}
        {activeTab === 'devocionales' && (
          <div className="space-y-6">
            {/* Solo profesores pueden escribir */}
            {role === 'profesor' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-blue-500" /> Nuevo Devocional
                </h2>
                <input 
                  type="text" 
                  placeholder="Título del devocional..."
                  value={newDevotional.title}
                  onChange={(e) => setNewDevotional({...newDevotional, title: e.target.value})}
                  className="w-full mb-4 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <textarea 
                  placeholder="Escribe el mensaje aquí..."
                  value={newDevotional.content}
                  onChange={(e) => setNewDevotional({...newDevotional, content: e.target.value})}
                  className="w-full h-32 mb-4 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
                <button 
                  onClick={handlePublish}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> Publicar
                </button>
              </div>
            )}

            {/* Lista de devocionales (Para profesores y estudiantes) */}
            <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">Últimos Devocionales</h2>
            {devotionals.length === 0 ? (
              <p className="text-gray-500 italic">No hay devocionales publicados aún.</p>
            ) : (
              devotionals.map((dev) => (
                <div key={dev.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{dev.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Publicado por {dev.author} • {new Date(dev.date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap">{dev.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Sección: Biblia Offline (Simulada para este código base) */}
        {activeTab === 'biblia' && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <BookOpen className="w-12 h-12 text-blue-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Biblia Offline Preparada</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              El motor de la Biblia está listo para funcionar incluso sin internet. 
              Los versículos se guardarán en la memoria caché de tu dispositivo.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}