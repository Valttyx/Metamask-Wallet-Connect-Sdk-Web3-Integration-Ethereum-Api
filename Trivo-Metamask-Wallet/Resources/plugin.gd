@tool
extends EditorPlugin

func _enter_tree():
	if OS.get_name() == "HTML5" or Engine.is_editor_hint():
		add_autoload_singleton("Metamask", "res://addons/metamask/Metamask.tscn")


func _exit_tree():
	remove_autoload_singleton("Metamask")
