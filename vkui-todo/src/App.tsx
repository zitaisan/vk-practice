import React, { useState, useEffect } from 'react';
import {
    ConfigProvider,
    AdaptivityProvider,
    AppRoot,
    View,
    Panel,
    PanelHeader,
    Group,
    CellButton,
    FormLayoutGroup,
    Input,
    Button,
    Spacing,
    SegmentedControl,
    usePlatform,
    ModalRoot,
    ModalPage,
    ModalPageHeader,
    ModalCard,
    Textarea,
    Search,
} from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
import { Icon28DeleteOutline, Icon28EditOutline } from '@vkontakte/icons';

type Task = {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
};

type Filter = 'all' | 'active' | 'completed';

const App = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [input, setInput] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [search, setSearch] = useState('');
    const [sortNewestFirst, setSortNewestFirst] = useState(true);
    const [editTaskId, setEditTaskId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [modal, setModal] = useState<string | null>(null);
    const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const platform = usePlatform();

    useEffect(() => {
        const saved = localStorage.getItem('tasks');
        if (saved) setTasks(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }, [tasks]);

    const addTask = () => {
        if (input.trim()) {
            const newTask: Task = {
                id: Date.now().toString(),
                text: input.trim(),
                completed: false,
                createdAt: Date.now(),
            };
            setTasks(prev => [ ...prev, newTask ]);
            setInput('');
            setActiveTaskId(newTask.id);
        }
    };

    const toggleTask = (id: string) => {
        setTasks(prev =>
            prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
        );
    };

    const openEditModal = (task: Task) => {
        setEditTaskId(task.id);
        setEditText(task.text);
        setModal('edit');
    };

    const saveEdit = () => {
        if (editTaskId && editText.trim()) {
            setTasks(prev =>
                prev.map(t => (t.id === editTaskId ? { ...t, text: editText.trim() } : t))
            );
            closeModal();
        }
    };

    const cancelEdit = () => {
        setEditText('');
        setEditTaskId(null);
        setModal(null);
    };

    const openDeleteModal = (id: string) => {
        setDeleteTaskId(id);
        setModal('delete');
    };

    const confirmDelete = () => {
        if (deleteTaskId) {
            setTasks(prev => prev.filter(t => t.id !== deleteTaskId));
            if (activeTaskId === deleteTaskId) setActiveTaskId(null);
            closeModal();
        }
    };

    const closeModal = () => {
        setModal(null);
        setEditTaskId(null);
        setEditText('');
        setDeleteTaskId(null);
    };

    const clearCompleted = () => {
        setTasks(prev => prev.filter(t => !t.completed));
        if (activeTaskId && tasks.find(t => t.id === activeTaskId)?.completed) {
            setActiveTaskId(null);
        }
    };

    const filteredTasks = tasks
        .filter(task => {
            if (filter === 'all') return true;
            if (filter === 'active') return !task.completed;
            return task.completed;
        })
        .filter(task => task.text.toLowerCase().includes(search.toLowerCase()));

    filteredTasks.sort((a, b) =>
        sortNewestFirst ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );

    const activeCount = tasks.filter(t => !t.completed).length;

    return (
        <>
            <ConfigProvider platform={platform}>
                <AdaptivityProvider>
                    <AppRoot>
                        <View activePanel="main">
                            <Panel id="main">
                                <PanelHeader>Список задач</PanelHeader>
                                <Group>
                                    <FormLayoutGroup>
                                        <Input
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            placeholder="Новая задача"
                                            onKeyDown={e => e.key === 'Enter' && addTask()}
                                        />
                                        <Button size="l" stretched onClick={addTask}>
                                            Добавить
                                        </Button>
                                    </FormLayoutGroup>

                                    <Spacing size={12} />

                                    {/* Поиск */}
                                    <Search
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Поиск задач"
                                    />

                                    <Spacing size={12} />

                                    {/* Фильтр и сортировка */}
                                    <SegmentedControl
                                        options={[
                                            { label: 'Все', value: 'all' },
                                            { label: 'Активные', value: 'active' },
                                            { label: 'Завершённые', value: 'completed' },
                                        ]}
                                        value={filter}
                                        onChange={value => setFilter(value as Filter)}
                                    />

                                    <Spacing size={12} />

                                    <Button
                                        size="m"
                                        mode="outline"
                                        onClick={() => setSortNewestFirst(prev => !prev)}
                                    >
                                        Сортировать: {sortNewestFirst ? 'Сначала новые' : 'Сначала старые'}
                                    </Button>

                                    <Spacing size={16} />

                                    {filteredTasks.length === 0 ? (
                                        <Group>
                                            <div style={{ padding: 12, color: 'var(--vkui--color_text_secondary)' }}>
                                                Нет задач для отображения
                                            </div>
                                        </Group>
                                    ) : (
                                        filteredTasks.map(task => (
                                            <CellButton
                                                key={task.id}
                                                onClick={() => {
                                                    toggleTask(task.id);
                                                    setActiveTaskId(task.id);
                                                }}
                                                style={{
                                                    textDecoration: task.completed ? 'line-through' : 'none',
                                                    opacity: task.completed ? 0.6 : 1,
                                                    backgroundColor: activeTaskId === task.id ? 'var(--vkui--color_background_secondary)' : undefined,
                                                }}
                                                after={
                                                    <>
                                                        <Icon28EditOutline
                                                            style={{ marginRight: 12 }}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                openEditModal(task);
                                                            }}
                                                        />
                                                        <Icon28DeleteOutline
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                openDeleteModal(task.id);
                                                            }}
                                                        />
                                                        {/* Dynamic Status Indicator */}
                                                        {task.completed ? 'Завершено' : 'Активно'}
                                                    </>
                                                }
                                            >
                                                {task.text}
                                            </CellButton>
                                        ))
                                    )}

                                    <Spacing size={16} />

                                    <Group>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 12px' }}>
                                            <div>Активных задач: {activeCount}</div>
                                            <Button
                                                mode="secondary"
                                                size="s"
                                                onClick={clearCompleted}
                                                disabled={tasks.every(t => !t.completed)}
                                            >
                                                Очистить завершённые
                                            </Button>
                                        </div>
                                    </Group>
                                </Group>
                            </Panel>
                        </View>
                    </AppRoot>
                </AdaptivityProvider>
            </ConfigProvider>

            <ModalRoot activeModal={modal} onClose={closeModal}>
                <ModalPage id="edit" onClose={closeModal} header={<ModalPageHeader>Редактировать задачу</ModalPageHeader>}>
                    <Group>
                        <FormLayoutGroup>
                            <Textarea
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                placeholder="Текст задачи"
                                style={{ minHeight: 100 }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                                <Button size="l" mode="secondary" onClick={cancelEdit} style={{ flexGrow: 1, marginRight: 8 }}>
                                    Отмена
                                </Button>
                                <Button size="l" stretched onClick={saveEdit} disabled={!editText.trim()} style={{ flexGrow: 1 }}>
                                    Сохранить
                                </Button>
                            </div>
                        </FormLayoutGroup>
                    </Group>
                </ModalPage>

                <ModalCard
                    id="delete"
                    onClose={closeModal}
                >
                    <h2 style={{ marginTop: 0, marginBottom: 16 }}>Удалить задачу?</h2>
                    <p>Вы уверены, что хотите удалить эту задачу?</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                        <Button mode="secondary" onClick={closeModal} style={{ marginRight: 8 }}>
                            Отмена
                        </Button>
                        <Button mode="primary" onClick={confirmDelete}>
                            Удалить
                        </Button>
                    </div>
                </ModalCard>
            </ModalRoot>
        </>
    );
};

export default App;
