import os
import zipfile

def zip_dir(dir_path, zip_path):
    # Ensure ZIP is written using deflate compression
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Base folder name in ZIP
        base_name = os.path.basename(dir_path)
        
        # Traverse directories and files
        for root, dirs, files in os.walk(dir_path):
            # 1. Add directories with explicit 0o755 permission attributes
            for d in dirs:
                full_path = os.path.join(root, d)
                rel_path = os.path.relpath(full_path, os.path.dirname(dir_path)).replace('\\', '/')
                
                zinfo = zipfile.ZipInfo(rel_path + '/')
                # Unix permission 755 shifted to the upper 16-bits of external attributes
                zinfo.external_attr = 0o755 << 16
                zipf.writestr(zinfo, '')
                
            # 2. Add files with explicit 0o644 permission attributes
            for f in files:
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, os.path.dirname(dir_path)).replace('\\', '/')
                
                zinfo = zipfile.ZipInfo(rel_path)
                # Unix permission 644 shifted to the upper 16-bits of external attributes
                zinfo.external_attr = 0o644 << 16
                
                with open(full_path, 'rb') as fp:
                    zipf.writestr(zinfo, fp.read())

if __name__ == '__main__':
    zip_dir('dist_prod', 'dist_prod.zip')
    print("dist_prod.zip successfully created with Unix file permissions (0644/0755)!")
