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
      `CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY NOT NULL, done INT, value TEXT);`
    );
    
    // Then, check if the category column exists, and add it if it doesn't
    const result = db.getAllSync("PRAGMA table_info(items);");
    const categoryColumnExists = result.some(column => column.name === 'category');
    
    if (!categoryColumnExists) {
      db.runSync("ALTER TABLE items ADD COLUMN category TEXT;");
    }
  });
  return db;
}

const db = openDatabase();

function Items({ done: doneHeading, onPressItem, onDeleteItem, onEditItem, theme, filterCategory }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.withTransactionSync(() => {
      let query = `select * from items where done = ?`;
      let params = [doneHeading ? 1 : 0];
      
      if (filterCategory !== 'All') {
        query += ` and category = ?`;
        params.push(filterCategory);
      }
      
      setItems(db.getAllSync(query, params));
    });
  }, [doneHeading, filterCategory]);

  const heading = doneHeading ? "Completed" : "Todo";

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionHeading, { color: theme.textColor }]}>{heading}</Text>
      {items.map(({ id, done, value, category }) => (
        <View key={id} style={[styles.todoItem, { backgroundColor: theme.cardBackground }]}>
          <TouchableOpacity
            onPress={() => onPressItem && onPressItem(id)}
            style={styles.itemTextContainer}
          >
            <Text style={[styles.itemText, done && styles.completedText, { color: theme.textColor }]}>
              {value}
            </Text>
            <Text style={[styles.categoryText, { color: theme.secondaryTextColor }]}>
              {category}
            </Text>
          </TouchableOpacity>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={() => onEditItem(id, value, category)}
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
  const [text, setText] = useState(null);
  const [category, setCategory] = useState("Personal");
  const [filterCategory, setFilterCategory] = useState("All");
  const [forceUpdate, forceUpdateId] = useForceUpdate();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [openCategory, setOpenCategory] = useState(false);
  const [openFilterCategory, setOpenFilterCategory] = useState(false);

  const categories = [
    { label: "All", value: "All" },
    { label: "Personal", value: "Personal" },
    { label: "Work", value: "Work" },
    { label: "Shopping", value: "Shopping" },
    { label: "Other", value: "Other" },
  ];

  const add = (text, category) => {
    if (text === null || text === "") {
      return false;
    }

    db.withTransactionSync(() => {
      db.runSync(`insert into items (done, value, category) values (0, ?, ?)`, [text, category]);
      forceUpdate();
    });
  };

  const deleteItem = (id) => {
    db.withTransactionSync(() => {
      db.runSync(`delete from items where id = ?;`, id);
      forceUpdate();
    });
  };

  const editItem = (id, newValue, newCategory) => {
    db.withTransactionSync(() => {
      db.runSync(`update items set value = ?, category = ? where id = ?;`, [newValue, newCategory, id]);
      forceUpdate();
    });
  };

  const handleEdit = (id, currentValue, currentCategory) => {
    setEditingId(id);
    setEditingText(currentValue);
    setEditingCategory(currentCategory);
    setModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (editingText.trim() === "") {
      Alert.alert("Error", "Task cannot be empty.");
      return;
    }
    editItem(editingId, editingText, editingCategory);
    setModalVisible(false);
    setEditingText("");
    setEditingCategory("");
    setEditingId(null);
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
          <View style={styles.inputContainer}>
            <TextInput
              onChangeText={(text) => setText(text)}
              onSubmitEditing={() => {
                add(text, category);
                setText(null);
              }}
              placeholder="What do you need to do?"
              placeholderTextColor={theme.placeholderTextColor}
              style={[styles.input, { color: theme.textColor, backgroundColor: theme.inputBackground }]}
              value={text}
            />
            <View style={styles.categoryPickerContainer}>
              <DropDownPicker
                open={openCategory}
                value={category}
                items={categories.filter(cat => cat.value !== 'All')}
                setOpen={setOpenCategory}
                setValue={setCategory}
                style={[styles.categoryPicker, { backgroundColor: theme.inputBackground }]}
                textStyle={{ color: theme.textColor }}
                dropDownContainerStyle={{ backgroundColor: theme.inputBackground }}
              />
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primaryColor }]}
              onPress={() => {
                add(text, category);
                setText(null);
              }}
            >
              <Ionicons name="add" size={24} color={theme.buttonTextColor} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterContainer}>
            <Text style={[styles.filterLabel, { color: theme.textColor }]}>Filter by category:</Text>
            <DropDownPicker
              open={openFilterCategory}
              value={filterCategory}
              items={categories}
              setOpen={setOpenFilterCategory}
              setValue={setFilterCategory}
              style={[styles.categoryPicker, { backgroundColor: theme.inputBackground }]}
              textStyle={{ color: theme.textColor }}
              dropDownContainerStyle={{ backgroundColor: theme.inputBackground }}
            />
          </View>

          <ScrollView style={styles.listArea}>
            <Items
              key={`forceupdate-todo-${forceUpdateId}`}
              done={false}
              onPressItem={(id) =>
                db.withTransactionSync(() => {
                  db.runSync(`update items set done = 1 where id = ?;`, id);
                  forceUpdate();
                })
              }
              onDeleteItem={deleteItem}
              onEditItem={handleEdit}
              theme={theme}
              filterCategory={filterCategory}
            />
            <Items
              done
              key={`forceupdate-done-${forceUpdateId}`}
              onPressItem={(id) =>
                db.withTransactionSync(() => {
                  db.runSync(`update items set done = 0 where id = ?;`, id);
                  forceUpdate();
                })
              }
              onDeleteItem={deleteItem}
              onEditItem={handleEdit}
              theme={theme}
              filterCategory={filterCategory}
            />
          </ScrollView>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(false);
            }}
          >
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
                <Text style={[styles.modalTitle, { color: theme.textColor }]}>Edit Task</Text>
                <TextInput
                  style={[styles.modalInput, { color: theme.textColor, borderColor: theme.primaryColor }]}
                  value={editingText}
                  onChangeText={setEditingText}
                />
                <DropDownPicker
                  open={openCategory}
                  value={editingCategory}
                  items={categories}
                  setOpen={setOpenCategory}
                  setValue={setEditingCategory}
                  style={[styles.categoryPicker, { backgroundColor: theme.backgroundColor, borderColor: theme.primaryColor }]}
                  textStyle={{ color: theme.textColor }}
                  dropDownContainerStyle={{ backgroundColor: theme.backgroundColor, borderColor: theme.primaryColor }}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={handleSaveEdit}
                    style={[styles.saveButton, { backgroundColor: theme.primaryColor }]}
                  >
                    <Text style={[styles.buttonText, { color: theme.buttonTextColor }]}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
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
});