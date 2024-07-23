# from colorName import color_list
import json

masterColorFile = open('GetMasterData/color.json')
color_list = json.load(masterColorFile)['color_list']

def find_nearest_color(hex_color, color_list):
    def validate_color_list(color_list):
        """Validates the color list and corrects any errors."""
        valid_colors = []
        for entry in color_list:
            if not isinstance(entry, list) or len(entry) != 2:
                print("Invalid entry:", entry)
                continue  # Skip invalid entries
            color_name, hex_value = entry
            if not isinstance(color_name, str) or not isinstance(hex_value, str):
                print("Invalid entry:", entry)
                continue  # Skip invalid entries
            if not hex_value.startswith('#') or len(hex_value) != 7:
                print("Invalid hex value in entry:", entry)
                continue  # Skip invalid entries
            try:
                int(hex_value[1:], 16)  # Attempt to convert the hex value to an integer
                valid_colors.append(entry)
            except ValueError:
                print("Invalid hex value in entry:", entry)
                continue  # Skip invalid entries
        return valid_colors

    def hex_to_rgb(hex_color):
        """Converts a hexadecimal color to RGB."""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def rgb_distance(color1, color2):
        """Calculates the Euclidean distance between two RGB colors."""
        return sum((c1 - c2) ** 2 for c1, c2 in zip(color1, color2)) ** 0.5

    def nearest_color(hex_color, color_list):
        """Finds the nearest color in a list based on Euclidean distance in RGB space."""
        target_rgb = hex_to_rgb(hex_color)
        nearest_name = None
        nearest_hex = None
        min_distance = float('inf')
        for color_name, hex_value in color_list:
            rgb_value = hex_to_rgb(hex_value)
            distance = rgb_distance(target_rgb, rgb_value)
            if distance < min_distance:
                min_distance = distance
                nearest_name = color_name
                nearest_hex = hex_value
        return nearest_hex, nearest_name

    color_list = validate_color_list(color_list)
    hex_color = hex_color.upper()  # Ensure uppercase hex color input
    nearest_hex, nearest_name = nearest_color(hex_color, color_list)
    return nearest_name, nearest_hex

hex_color = "#1E93FF"  # Example hexadecimal color
nearest_name, nearest_hex = find_nearest_color(hex_color, color_list)
print("Nearest color to", hex_color, "is:", nearest_name, "with hexcode:", nearest_hex)
