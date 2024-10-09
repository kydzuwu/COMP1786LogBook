import { useState, useEffect, useContext } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  FlatList,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";
import { ThemeContext } from './ThemeContext';
import DropDownPicker from 'react-native-dropdown-picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => { },
        };
      },
    };
  }

  const db = SQLite.openDatabaseSync("db.db");
  db.withTransactionSync(() => {
    // First, create the table if it doesn't exist
    db.runSync(
      `CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY NOT NULL, 
        done INT, 
        value TEXT, 
        category TEXT
      );`
    );
    
    // Check if the due_date column exists, and add it if it doesn't
    const result = db.getAllSync("PRAGMA table_info(items);");
    const dueDateColumnExists = result.some(column => column.name === 'due_date');
    
    if (!dueDateColumnExists) {
      db.runSync("ALTER TABLE items ADD COLUMN due_date TEXT;");
    }

    // Check if the priority column exists, and add it if it doesn't
    const priorityColumnExists = result.some(column => column.name === 'priority');
    
    if (!priorityColumnExists) {
      db.runSync("ALTER TABLE items ADD COLUMN priority TEXT DEFAULT 'medium';");
    }

    // Check if the notes column exists, and add it if it doesn't
    const notesColumnExists = result.some(column => column.name === 'notes');
    
    if (!notesColumnExists) {
      db.runSync("ALTER TABLE items ADD COLUMN notes TEXT;");
    }
    
    // Create tags table if it doesn't exist
    db.runSync(
      `CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT UNIQUE
      );`
    );
    
    // Create item_tags table if it doesn't exist
    db.runSync(
      `CREATE TABLE IF NOT EXISTS item_tags (
        item_id INTEGER,
        tag_id INTEGER,
        FOREIGN KEY(item_id) REFERENCES items(id),
        FOREIGN KEY(tag_id) REFERENCES tags(id)
      );`
    );
  });
  return db;
}

const db = openDatabase();

function Items({ done: doneHeading, onPressItem, onDeleteItem, onEditItem, theme, filterCategory, searchText, filters, sortBy, sortOrder }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const getItems = () => {
      let query = `SELECT * FROM items WHERE done = ?`;
      let params = [doneHeading ? 1 : 0];
      
      if (filterCategory !== 'All') {
        query += ` AND category = ?`;
        params.push(filterCategory);
      }

      if (searchText) {
        query += ` AND value LIKE ?`;
        params.push(`%${searchText}%`);
      }

      if (filters.priority !== 'all') {
        query += ` AND priority = ?`;
        params.push(filters.priority);
      }

      // Modified date filtering
      const today = new Date().toISOString().split('T')[0];
      if (filters.dueDate === 'today') {
        query += ` AND due_date = ?`;
        params.push(today);
      } else if (filters.dueDate === 'week') {
        const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        query += ` AND due_date BETWEEN ? AND ?`;
        params.push(today, weekLater);
      }

      if (sortBy === 'date') {
        query += ` ORDER BY due_date ${sortOrder}`;
      } else if (sortBy === 'priority') {
        query += ` ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END ${sortOrder}`;
      } else {
        query += ` ORDER BY ${sortBy} ${sortOrder}`;
      }

      return db.getAllSync(query, params);
    };

    setItems(getItems());
  }, [doneHeading, filterCategory, searchText, filters, sortBy, sortOrder]);

  const heading = doneHeading ? "Completed" : "Todo";

  if (items.length === 0) {
    return null;
  }


  return (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionHeading, { color: theme.textColor }]}>{heading}</Text>
      {items.map(({ id, done, value, category, priority, due_date, notes }) => (
        <View key={id} style={[styles.todoItem, { backgroundColor: theme.cardBackground }]}>
          <TouchableOpacity
            onPress={() => onPressItem && onPressItem(id)}
            style={styles.itemTextContainer}
          >
            <Text style={[styles.itemText, done && styles.completedText, { color: theme.textColor }]}>
              {value}
            </Text>
            <Text style={[styles.categoryText, { color: theme.secondaryTextColor }]}>
              {category} - Priority: {priority}
            </Text>
            {due_date && (
              <Text style={[styles.dueDateText, { color: theme.secondaryTextColor }]}>
                Due: {new Date(due_date).toLocaleDateString()}
              </Text>
            )}
          </TouchableOpacity>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={() => onEditItem(id, value, category, priority, due_date, notes)}
              style={[styles.iconButton, { backgroundColor: theme.editButtonColor }]}
            >
              <Ionicons name="pencil" size={18} color={theme.buttonTextColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDeleteItem && onDeleteItem(id)}
              style={[styles.iconButton, { backgroundColor: theme.deleteButtonColor }]}
            >
              <Ionicons name="trash" size={18} color={theme.buttonTextColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onPressItem && onPressItem(id)}
              style={[styles.iconButton, { backgroundColor: done ? theme.undoButtonColor : theme.completeButtonColor }]}
            >
              <Ionicons name={done ? "arrow-undo" : "checkmark"} size={18} color={theme.buttonTextColor} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function App() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Personal");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState(null);
  const [notes, setNotes] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({ priority: 'all', dueDate: 'all' });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [forceUpdate, forceUpdateId] = useForceUpdate();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [editingPriority, setEditingPriority] = useState("medium");
  const [editingDueDate, setEditingDueDate] = useState(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [openCategory, setOpenCategory] = useState(false);
  const [openFilterCategory, setOpenFilterCategory] = useState(false);
  const [openPriority, setOpenPriority] = useState(false);

  const categories = [
    { label: "All", value: "All" },
    { label: "Personal", value: "Personal" },
    { label: "Work", value: "Work" },
    { label: "Shopping", value: "Shopping" },
    { label: "Other", value: "Other" },
  ];

  const priorities = [
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
  ];


  const add = (text, category, priority, dueDate, notes) => {
    if (text === null || text === "") {
      return false;
    }

    db.withTransactionSync(() => {
      db.runSync(`INSERT INTO items (done, value, category, priority, due_date, notes) VALUES (0, ?, ?, ?, ?, ?);`, 
        [text, category, priority, dueDate ? new Date(dueDate).toISOString().split('T')[0] : null, notes]);
      forceUpdate();
    });
  };

  const deleteItem = (id) => {
    db.withTransactionSync(() => {
      db.runSync(`DELETE FROM items WHERE id = ?;`, id);
      forceUpdate();
    });
  };

  const editItem = (id, newValue, newCategory, newPriority, newDueDate, newNotes) => {
    db.withTransactionSync(() => {
      db.runSync(`UPDATE items SET value = ?, category = ?, priority = ?, due_date = ?, notes = ? WHERE id = ?;`, 
        [newValue, newCategory, newPriority, newDueDate ? new Date(newDueDate).toISOString().split('T')[0] : null, newNotes, id]);
      forceUpdate();
    });
  };

  const handleEdit = (id, currentValue, currentCategory, currentPriority, currentDueDate, currentNotes) => {
    setEditingId(id);
    setEditingText(currentValue);
    setEditingCategory(currentCategory);
    setEditingPriority(currentPriority);
    setEditingDueDate(currentDueDate);
    setEditingNotes(currentNotes);
    setModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (editingText.trim() === "") {
      Alert.alert("Error", "Task cannot be empty.");
      return;
    }
    editItem(editingId, editingText, editingCategory, editingPriority, editingDueDate, editingNotes);
    setModalVisible(false);
    resetEditingState();
  };

  const resetEditingState = () => {
    setEditingId(null);
    setEditingText("");
    setEditingCategory("");
    setEditingPriority("medium");
    setEditingDueDate(null);
    setEditingNotes("");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Text style={[styles.heading, { color: theme.textColor }]}>To Do App</Text>

      {Platform.OS === "web" ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={[styles.heading, { color: theme.textColor }]}>
            Expo SQLite is not supported on web!
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.topSection}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primaryColor }]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={[styles.buttonText, { color: theme.buttonTextColor }]}>Add New Todo</Text>
            </TouchableOpacity>

            <View style={styles.filterSection}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: theme.inputBackground, color: theme.textColor }]}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search tasks..."
                placeholderTextColor={theme.placeholderTextColor}
              />
              <View style={styles.pickerContainer}>
                <DropDownPicker
                  open={openFilterCategory}
                  value={filterCategory}
                  items={categories}
                  setOpen={setOpenFilterCategory}
                  setValue={setFilterCategory}
                  style={[styles.picker, { backgroundColor: theme.inputBackground }]}
                  textStyle={{ color: theme.textColor }}
                  dropDownContainerStyle={{ backgroundColor: theme.inputBackground }}
                  placeholder="Filter by Category"
                />
              </View>
            </View>
          </View>

          <ScrollView style={styles.listArea}>
            <Items
              key={`forceupdate-todo-${forceUpdateId}`}
              done={false}
              onPressItem={(id) =>
                db.withTransactionSync(() => {
                  db.runSync(`UPDATE items SET done = 1 WHERE id = ?;`, id);
                  forceUpdate();
                })
              }
              onDeleteItem={deleteItem}
              onEditItem={handleEdit}
              theme={theme}
              filterCategory={filterCategory}
              searchText={searchText}
              filters={filters}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
            <Items
              done
              key={`forceupdate-done-${forceUpdateId}`}
              onPressItem={(id) =>
                db.withTransactionSync(() => {
                  db.runSync(`UPDATE items SET done = 0 WHERE id = ?;`, id);
                  forceUpdate();
                })
              }
              onDeleteItem={deleteItem}
              onEditItem={handleEdit}
              theme={theme}
              filterCategory={filterCategory}
              searchText={searchText}
              filters={filters}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          </ScrollView>

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(false);
              resetEditingState();
            }}
          >
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
                <Text style={[styles.modalTitle, { color: theme.textColor }]}>
                  {editingId ? "Edit Task" : "Add New Task"}
                </Text>
                <TextInput
                  style={[styles.modalInput, { color: theme.textColor, borderColor: theme.primaryColor }]}
                  value={editingId ? editingText : text}
                  onChangeText={editingId ? setEditingText : setText}
                  placeholder="What do you need to do?"
                  placeholderTextColor={theme.placeholderTextColor}
                />
                <DropDownPicker
                  open={openCategory}
                  value={editingId ? editingCategory : category}
                  items={categories.filter(cat => cat.value !== 'All')}
                  setOpen={setOpenCategory}
                  setValue={editingId ? setEditingCategory : setCategory}
                  style={[styles.categoryPicker, { backgroundColor: theme.backgroundColor, borderColor: theme.primaryColor }]}
                  textStyle={{ color: theme.textColor }}
                  dropDownContainerStyle={{ backgroundColor: theme.backgroundColor, borderColor: theme.primaryColor }}
                  placeholder="Select Category"
                />
                <DropDownPicker
                  open={openPriority}
                  value={editingId ? editingPriority : priority}
                  items={priorities}
                  setOpen={setOpenPriority}
                  setValue={editingId ? setEditingPriority : setPriority}
                  style={[styles.priorityPicker, { backgroundColor: theme.backgroundColor, borderColor: theme.primaryColor }]}
                  textStyle={{ color: theme.textColor }}
                  dropDownContainerStyle={{ backgroundColor: theme.backgroundColor, borderColor: theme.primaryColor }}
                  placeholder="Select Priority"
                />
                <TouchableOpacity 
                  onPress={() => editingId ? setEditingDueDate(new Date()) : setDueDate(new Date())} 
                  style={styles.dateButton}
                >
                  <Text style={{ color: theme.textColor }}>
                    {editingId
                      ? (editingDueDate ? new Date(editingDueDate).toLocaleDateString() : 'Set Due Date')
                      : (dueDate ? new Date(dueDate).toLocaleDateString() : 'Set Due Date')
                    }
                  </Text>
                </TouchableOpacity>
                {(editingId ? editingDueDate : dueDate) && (
                  <DateTimePicker
                    value={new Date(editingId ? editingDueDate : dueDate)}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      if (editingId) {
                        setEditingDueDate(selectedDate ? selectedDate.toISOString() : null);
                      } else {
                        setDueDate(selectedDate ? selectedDate.toISOString() : null);
                      }
                    }}
                  />
                )}
                <TextInput
                  style={[styles.modalInput, { color: theme.textColor, borderColor: theme.primaryColor }]}
                  value={editingId ? editingNotes : notes}
                  onChangeText={editingId ? setEditingNotes : setNotes}
                  placeholder="Add notes..."
                  placeholderTextColor={theme.placeholderTextColor}
                  multiline
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      if (editingId) {
                        handleSaveEdit();
                      } else {
                        add(text, category, priority, dueDate, notes);
                        setText("");
                        setNotes("");
                        setDueDate(null);
                        setModalVisible(false);
                      }
                    }}
                    style={[styles.saveButton, { backgroundColor: theme.primaryColor }]}
                  >
                    <Text style={[styles.buttonText, { color: theme.buttonTextColor }]}>
                      {editingId ? "Save" : "Add"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      resetEditingState();
                    }}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
      <TouchableOpacity onPress={toggleTheme} style={[styles.themeToggle, { backgroundColor: theme.primaryColor }]}>
        <Ionicons name={theme.dark ? "sunny" : "moon"} size={24} color={theme.buttonTextColor} />
      </TouchableOpacity>
    </View>
  );
}

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Constants.statusBarHeight + 10,
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    marginRight: 10,
  },
  categoryPickerContainer: {
    width: 120,
    marginRight: 10,
    zIndex: 1000,
  },
  categoryPicker: {
    borderRadius: 25,
    height: 50,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  listArea: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
  },
  completedText: {
    textDecorationLine: "line-through",
  },
  categoryText: {
    fontSize: 12,
    marginTop: 5,
  },
  buttonsContainer: {
    flexDirection: "row",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  filterContainer: {
    marginBottom: 20,
    zIndex: 999,
  },
  filterLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  themeToggle: {
    position: 'absolute',
    top: Constants.statusBarHeight + 10,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalInput: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    width: "100%",
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  priorityPicker: {
    borderRadius: 25,
    height: 50,
    marginTop: 10,
  },
  dateButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  notesInput: {
    height: 100,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 16,
    marginTop: 10,
    textAlignVertical: 'top',
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 10,
  },
  dueDateText: {
    fontSize: 12,
    marginTop: 5,
  },
  addTodoSection: {
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  pickerContainer: {
    marginBottom: 10,
    zIndex: 1000,
  },
  picker: {
    borderRadius: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 10,
  },
  dateButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  notesInput: {
    height: 100,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  addButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  searchInput: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 10,
  },
  topSection: {
    marginBottom: 20,
  },
  addButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  filterSection: {
    marginBottom: 10,
  },
  listArea: {
    flex: 1,
  },
});