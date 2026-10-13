import React, { useState } from 'react';
import './App.css';

const API_BASE_URL = "https://forty-games-wait.loca.lt/"; 

function App() {
  const [filePath, setFilePath] = useState("C:\\work\\Programming in Python\\practic\\lab2\\data\\students.csv");
  const [students, setStudents] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Ожидание загрузки файла...");
  const [exportN, setExportN] = useState("5"); // По умолчанию ТОП-5
  const [exportPath, setExportPath] = useState("C:\\work\\Programming in Python\\practic\\lab2\\data\\top_students.csv");

  // Состояния для форм добавления/обновления
  const [newStudent, setNewStudent] = useState({ id: '', name: '', grades: '' });
  //const [updateMark, setUpdateMark] = useState({ id: '', num: '', val: '' });

  // Функция получения данных с бэкенда
  const refreshStudents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/students`);
      const data = await res.json();
      setIsLoaded(data.state);
      if (data.state) {
        setStudents(data.students);
      }
    } catch (err) {
      setStatusMessage("Ошибка: Бэкенд на ноутбуке недоступен!");
    }
  };

  // 1. Загрузка файла
  const handleLoad = async () => {
    try {
      setStatusMessage("Загрузка...");
      const res = await fetch(`${API_BASE_URL}/api/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(data.message);
        refreshStudents();
      } else {
        setStatusMessage(`Ошибка: ${data.detail}`);
      }
    } catch (err) {
      setStatusMessage("Не удалось связаться с сервером ноутбука");
    }
  };

  // 2. Сохранение изменений в CSV на диск ноутбука
  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/save`, { method: 'POST' });
      const data = await res.json();
      setStatusMessage(data.message);
    } catch (err) {
      setStatusMessage("Ошибка сохранения");
    }
  };

  // 4. Добавление студента
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/students/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newStudent.id,
          name: newStudent.name,
          grades: newStudent.grades.split(',').map(g => g.trim())
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage("Студент добавлен!");
        refreshStudents();
      } else {
        alert(data.detail);
      }
    } catch (err) {
      console.error(err);
    }
  };

  //обновление и удаление оценки
  const handleCellSave = async (studentId, markIndex, newValue) => {
    const markNumber = markIndex + 1;
    const val = newValue.trim();

    const isDelete = (val === "");
    const method = isDelete ? 'DELETE' : 'PUT';
    const body = isDelete 
      ? { id: String(studentId), mark_number: String(markNumber) }
      : { id: String(studentId), mark_number: String(markNumber), mark: val };

    try {
      const res = await fetch(`${API_BASE_URL}/api/students/mark`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.detail);
      }
    } catch (err) {
      console.error("Ошибка сети:", err);
    }
    refreshStudents(); 
  };

  // Сортировка (avg, name, id)
  const handleSort = async (criteria) => {
    await fetch(`${API_BASE_URL}/api/sort/${criteria}`, { method: 'POST' });
    refreshStudents();
  };

  // Удаление студента
  const handleDeleteStudent = async (id) => {
    await fetch(`${API_BASE_URL}/api/students/${id}`, { method: 'DELETE' });
    refreshStudents();
  };

  // Экспорт ТОП-N студентов
  const handleExportTop = async (e) => {
    e.preventDefault();
    try {
      setStatusMessage("Экспортирую...");
      const res = await fetch(`${API_BASE_URL}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          n: String(exportN),
          path: exportPath
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(data.message);
      } else {
        setStatusMessage(`Ошибка экспорта: ${data.detail}`);
      }
    } catch (err) {
      setStatusMessage("Не удалось связаться с сервером для экспорта");
      console.error(err);
    }
  };

  return (
    <div className="container" style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Управление студентами — Веб-интерфейс</h1>
      
      <div className="card" style={{ background: '#f0f2f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Шаг 1: Подключение файла базы данных</h3>
        <input 
          type="text" 
          value={filePath} 
          onChange={(e) => setFilePath(e.target.value)} 
          style={{ width: '60%', padding: '8px', marginRight: '10px' }}
        />
        <button onClick={handleLoad} style={{ padding: '8px 15px', marginRight: '5px' }}>Загрузить из CSV</button>
        <button onClick={handleSave} style={{ padding: '8px 15px', background: '#4CAF50', color: 'white' }}>Сохранить изменения на диск</button>
        <p><strong>Статус системы:</strong> {statusMessage}</p>
      </div>
      {isLoaded && (
        <div style={{ background: '#e4e6eb', padding: '10px', borderRadius: '6px', display: 'flex', gap: '15px', alignItems: 'center', marginTop: '10px' }}>
          <div>
            <label style={{ marginRight: '5px', fontSize: '14px' }}>ТОП студентов (N):</label>
            <input 
              type="number" 
              value={exportN} 
              min="1"
              onChange={(e) => setExportN(e.target.value)} 
              style={{ width: '50px', padding: '5px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ marginRight: '5px', fontSize: '14px' }}>Путь для экспорта:</label>
            <input 
              type="text" 
              value={exportPath} 
              onChange={(e) => setExportPath(e.target.value)} 
              style={{ width: '80%', padding: '5px' }}
            />
          </div>
          <button onClick={handleExportTop} style={{ padding: '8px 15px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Экспорт ТОП-N
          </button>
        </div>
      )}
      {isLoaded && (
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 2 }}>
            <h3>Список студентов в кэше</h3>
            <div style={{ marginBottom: '10px' }}>
              Сортировка: 
              <button onClick={() => handleSort('id')}>По ID</button>
              <button onClick={() => handleSort('name')}>По имени</button>
              <button onClick={() => handleSort('avg')}>По среднему баллу</button>
            </div>
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ФИО</th>
                  <th>Оценки</th>
                  <th>Ср. балл</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.name}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {s.grades.map((grade, idx) => (
                          <input
                            key={idx}
                            type="text"
                            defaultValue={grade === " " ? "" : grade}
                            style={{ width: '35px', textAlign: 'center', padding: '4px' }}
                            onBlur={(e) => handleCellSave(s.id, idx, e.target.value)}
                            onChange={(e) => {
                              e.target.value = e.target.value.replace(/\D/g, '');
                              if (e.target.value.length > 2) {
                                e.target.value = e.target.value.slice(0, 1);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCellSave(s.id, idx, e.target.value);
                            }}
                          />
                        ))}
                      </div>
                    </td>
                    <td><strong>{s.average}</strong></td>
                    <td>
                      <button onClick={() => handleDeleteStudent(s.id)} style={{ color: 'red' }}>Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ flex: 1, background: '#fafafa', padding: '15px', borderRadius: '8px' }}>
            <h3>Добавить студента</h3>
            <form onSubmit={handleAddStudent}>
              <input type="text" placeholder="ID" required value={newStudent.id} onChange={e => setNewStudent({...newStudent, id: e.target.value})} /><br/><br/>
              <input type="text" placeholder="ФИО" required value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} /><br/><br/>
              <input type="text" placeholder="Оценки (через запятую)" value={newStudent.grades} onChange={e => setNewStudent({...newStudent, grades: e.target.value})} /><br/><br/>
              <button type="submit">Добавить</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
